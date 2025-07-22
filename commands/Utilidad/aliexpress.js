import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import dotenv from "dotenv";
import crypto from "crypto";
import axios from "axios";

// Cargar variables de entorno
dotenv.config();

export const data = new SlashCommandBuilder()
.setName('aliexpress')
.setDescription('Obtiene información detallada de un producto de AliExpress.')
.addSubcommand(sub =>
  sub
  .setName('product-info')
  .setDescription('Obtiene información detallada de un producto de AliExpress.')
  .addStringOption(opt =>
    opt
    .setName('url')
    .setDescription('URL del producto.')
    .setRequired(true)
  )
);

// Función para verificar si la URL es válida (para este contexto)
function isValidURL(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("aliexpress.com") && /item\/(\d+)\.html/.test(url);
  } catch {
    return false;
  }
}

// Función para extraer el ID del producto de la URL
function getProductId(url) {
  const match = url.match(/item\/(\d+)\.html/);
  return match ? match[1] : null;
}

// Función para generar la firma de la solicitud
function generateSignature(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  let base = secret;
  for (const key of sortedKeys) base += key + params[key];
  base += secret;
  return crypto.createHash("md5").update(base).digest("hex").toUpperCase();
}

export async function run(client, interaction) {
  const subcommand = interaction.options.getSubcommand();
  
  // Variables de entorno
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  const trackingId = process.env.ALIEXPRESS_TRACKING_ID;
  
  if (subcommand === 'product-info') {
    const url = interaction.options.getString('url');  
    
    // Verificar si la URL es válida
    if (!isValidURL(url)) {
      await interaction.reply({ content: "<:Advertencia:1302055825053057084> Debes proporcionar una URL de AliExpress válida.", flags: 64, allowedMentions: { repliedUser: false }});
      return;
    }
    
    try {
      // Indicar que se está procesando la solicitud
      await interaction.deferReply();
      
      // Hacer la petición
      const productId = getProductId(url);
      const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
      const params = {
        app_key: appKey,
        method: "aliexpress.affiliate.productdetail.get",
        sign_method: "md5",
        timestamp,
        format: "json",
        v: "2.0",
        product_ids: productId,
        target_currency: "USD",
        target_language: "es",
        tracking_id: trackingId,
      };
      
      const sign = generateSignature(params, appSecret);
      const query = new URLSearchParams({ ...params, sign });
      
      const res = await axios.get(`https://api-sg.aliexpress.com/sync?${query.toString()}`);
      const product = res.data?.aliexpress_affiliate_productdetail_get_response?.resp_result?.result?.products?.product?.[0];
      
      if (!product) {
        await interaction.editReply({ content: "<:Advertencia:1302055825053057084> No se pudo obtener información de este producto.", allowedMentions: { repliedUser: false }});
        return;
      }
      
      // Extraer información del producto
      const title = product.product_title || "Sin título";
      const shopName = product.shop_name || "Tienda desconocida";
      const productID = product.product_id?.toString() || "Desconocido";
      const mainImage = product.product_main_image_url;
      const original = parseFloat(product.target_original_price);
      const sale = parseFloat(product.target_sale_price);
      const appPrice = parseFloat(product.target_app_sale_price);
      const discount = product.discount || `${Math.round((1 - sale / original) * 100)}%`;
      const sold = product.lastest_volume?.toString() || "Desconocido";
      const shopURL = product.shop_url || "https://www.aliexpress.com/";
      
      // Embed Principal
      const embed = new EmbedBuilder()
      .setColor(0xE43225)
      .setAuthor({ name: `${client.user.username} - ${interaction.commandName}`, iconURL: client.user.displayAvatarURL()})
      .setTitle(title.length > 256 ? title.slice(0, 253) + "..." : title)
      .setURL(url)
      .setImage(mainImage)
      .setFields(
        { name: "🆔 ID del producto", value: productID, inline: false },
        { name: "💵 Precio", value: `~~$${original.toFixed(2)} USD~~ **$${sale.toFixed(2)} USD** (-${discount})`, inline: false },
        { name: "📦 Vendidos", value: sold, inline: true },
      )
      .setFooter({ text: `🛒・${shopName}` });
      
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setEmoji('🛒')
        .setLabel('Ver tienda')
        .setStyle(ButtonStyle.Link)
        .setURL(shopURL)
      );
      
      await interaction.editReply({ embeds: [embed], components: [buttons] });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar este comando.", allowedMentions: { repliedUser: false }});
    }
  }
}