import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { query } from "../../database.js";
import * as cheerio from "cheerio";
import axios from "axios";

export const data = new SlashCommandBuilder()
.setName('manga-notify')
.setDescription('Te suscribe a un servicio que te notificará cuando se publiquen capítulos en un manga de ZonaTMO.')
.addSubcommand(sub =>
  sub
  .setName('subscribe')
  .setDescription('Te suscribe a un servicio que te notificará cuando se publiquen capítulos en un manga de ZonaTMO.')
  .addStringOption(opt =>
    opt
    .setName('manga-url')
    .setDescription('URL del manga. Ejemplo: https://zonatmo.com/library/manga/23741/dr-stone')
    .setRequired(true)
  )
)
.addSubcommand(sub =>
  sub
  .setName('unsubscribe')
  .setDescription('Cancela una o varias de tus suscripciones existentes.')
)
.addSubcommand(sub =>
  sub
  .setName('subscriptions')
  .setDescription('Muestra tu lista de suscripciones activas.')
);

// Función para verificar si la URL es válida (para este contexto)
function isValidURL(url) {
  try {
    const parsedURL = new URL(url);
    const regex = /^https:\/\/zonatmo\.com\/library\/[^\/]+\/\d+\/[^\/]+$/;
    return regex.test(parsedURL.href);
  } catch (error) {
    return false;
  }
}

export async function run(client, interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userID = interaction.user.id;
  
  if (subcommand === 'subscribe') {
    const url = interaction.options.getString('manga-url');
    
    // Verificar si el valor proporcionado es una URL válida.
    if (!isValidURL(url)) {
      await interaction.reply({ content: "<:Advertencia:1302055825053057084> Debes proporcionar una URL de ZonaTMO válida.\nEjemplo: `https://zonatmo.com/library/manga/23741/dr-stone`", flags: 64, allowedMentions: { repliedUser: false }});
      return;
    }
    
    try {
      // Verificar si la suscripción ya existe
      const existing = await query('SELECT * FROM mangasuscription WHERE userID = ? AND mangaUrl = ?', [userID, url]);
      if (existing.length > 0) {
        await interaction.reply({ content: "<:Advertencia:1302055825053057084> Ya estás suscrito a este manga.", flags: 64, allowedMentions: { repliedUser: false }});
        return;
      }
      
      // Limitar a 5 suscripciones por usuario
      const subscriptions = await query('SELECT * FROM mangasuscription WHERE userID = ?', [userID]);
      if (subscriptions.length >= 5 && userID !== '811071747189112852') {
        await interaction.reply({ content: "<:Advertencia:1302055825053057084> Has alcanzado tu límite de `5` suscripciones activas.", flags: 64, allowedMentions: { repliedUser: false }});
        return;
      }
      
      // Simular un navegador real para evitar bloqueos
      const { data: html } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
      
      // Analizar el HTML con cheerio, obtener el título y el último capítulo
      const $ = cheerio.load(html);
      const mangaTitle = $('h1.element-title.my-2').clone().children().remove().end().text().trim();
      const mangaStatus = $('h5.element-subtitle').filter((i, el) => $(el).text().trim() === 'Estado').next('span.book-status').text().trim();
      const lastChapter = $('#chapters li.upload-link:first-of-type h4 a').first().text().trim();
      
      // Extraer solo el número del capítulo
      const match = lastChapter.match(/Cap[ií]tulo\s+([\d.]+)/i);
      const lastChapterNumber = match ? parseFloat(match[1]) : null;
      
      // Comprobar el estado del manga antes de registrar la suscripción
      if (mangaStatus === 'Finalizado') {
        await interaction.reply({ content: "<:Advertencia:1302055825053057084> No puedes suscribirte a un manga ya finalizado.", flags: 64, allowedMentions: { repliedUser: false }});
        return;
      }
      
      // Registrar la suscripción
      await query('INSERT INTO mangasuscription (userID, mangaTitle, mangaUrl, lastChapter) VALUES (?, ?, ?, ?)', [userID, mangaTitle, url, lastChapterNumber]);
      
      // Confirmar la interacción
      await interaction.reply({ content: `<:Done:1326292171099345006> Te has suscrito a [${mangaTitle}](<${url}>).`, allowedMentions: { repliedUser: false }});
    } catch (error) {
      interaction.reply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al procesar la suscripción.", flags: 64, allowedMentions: { repliedUser: false }}, { content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar este comando.", flags: 64, allowedMentions: { repliedUser: false }});
      console.log(error);
    }
  }
  
  else if (subcommand === 'unsubscribe') {
    try {
      // Consultar las suscripciones activas del usuario
      const result = await query('SELECT * FROM mangasuscription WHERE userID = ?', [userID]);
      
      if (result.length === 0) {
        await interaction.reply({ content: "<:Advertencia:1302055825053057084> No tienes ninguna suscripción activa en este momento.", allowedMentions: { repliedUser: false }});
        return;
      }
      
      // Select menú con las suscripciones      
      const options = result.map(row => ({
        label: row.mangaTitle.length > 100 ? row.mangaTitle.slice(0, 97) + '...' : row.mangaTitle,
        description: row.mangaUrl,
        value: String(row.id),
      }));
      
      const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('unsubscribeSelector')
      .setPlaceholder('Escoge una o varias opciones...')
      .setMinValues(1)
      .setMaxValues(options.length)
      .setOptions(options)
      .setDisabled(false);
      
      const row = new ActionRowBuilder().addComponents(selectMenu);
      
      // Envíar mensaje
      await interaction.reply({ content: "<:Info:1345848332760907807> Selecciona cada manga del que deseas desuscribirte.", components: [row], allowedMentions: { repliedUser: false }});
      
      // Evento del colector
      const filter = i => i.customId === 'unsubscribeSelector' && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 2 * 60 * 1000, max: 1 });
      
      collector.on('collect', async i => {
        const selectedIds = i.values;
        
        // Eliminar los mangas seleccionados de la base de datos
        for (const id of selectedIds) {
          await query('DELETE FROM mangasuscription WHERE id = ?', [id]);
        }
        
        // Confirmar la interacción
        await i.update({ content: "<:Done:1326292171099345006> Te has desuscrito correctamente los mangas seleccionados.", components: [], allowedMentions: { repliedUser: false }});
      });
      
      // Finalizar el colector
      collector.on('end', async () => {
        try {
          // Obtener el mensaje original
          const message = await interaction.fetchReply();
          
          // Desactivar el select menu
          const disabledComponents = message.components.map(row => {
            return new ActionRowBuilder().addComponents(
              row.components.map(component => 
                StringSelectMenuBuilder.from(component).setDisabled(true)
              )
            );
          });
          
          // Editar el mensaje original con el selector deshabilitado
          await interaction.editReply({ components: disabledComponents });
        } catch (error) {
          // Si da error, puede deberse a que el mensaje se eliminó. Ignorar para evitar problemas.
          return;
        }
      });
    } catch (error) {
      interaction.reply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar este comando.", flags: 64, allowedMentions: { repliedUser: false }});
      console.log(error);
    }
  }
  
  else if (subcommand === 'subscriptions') {
    try {
      // Consultar las suscripciones activas del usuario
      const result = await query('SELECT * FROM mangasuscription WHERE userID = ?', [userID]);
      
      if (result.length === 0) {
        await interaction.reply({ content: "<:Done:1326292171099345006> No tienes ninguna suscripción activa en este momento.", allowedMentions: { repliedUser: false }});
        return;
      }
      
      // Embed con las suscripciones
      const embed = new EmbedBuilder()
      .setColor(0x2957ba)
      .setAuthor({ name: `${client.user.username} - ${interaction.commandName}`, iconURL: client.user.displayAvatarURL()})
      .setTitle(`Suscripciones activas de: ${interaction.user.displayName}`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setDescription(result.map((manga) => `- [${manga.mangaTitle}](${manga.mangaUrl})`).join('\n'))
      .setFooter({ text: "Puedes tener un máximo de 5 suscripciones activas." });
      
      // Enviar mensaje
      interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
    } catch (error) {
      interaction.reply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar este comando.", flags: 64, allowedMentions: { repliedUser: false }});
      console.log(error);
    }
  }
}