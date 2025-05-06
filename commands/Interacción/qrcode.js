import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import qrcode from "qrcode";

export const data = new SlashCommandBuilder()
.setName('qrcode')
.setDescription('Genera un código QR para una dirección URL.')
.addStringOption(option =>
  option.setName('url')
  .setDescription('URL a codificar.')
  .setRequired(true)
);

// Función para verificar si una URL es válida
function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

export async function run(client, interaction) {
  const url = interaction.options.getString('url');
  
  // Verificar si el valor proporcionado es una URL válida.
  if (!isValidURL(url)) {
    await interaction.reply({ content: "<:Advertencia:1302055825053057084> Debes proporcionar una URL válida.", flags: 64, allowedMentions: { repliedUser: false } });
    return;
  }
  
  // Generar el código QR y envíar el mensaje
  const qrCode = await qrcode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    scale: 10,
    margin: 4
  });
  
  const base64Data = qrCode.replace(/^data:image\/png;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");
  
  const attachment = new AttachmentBuilder(imageBuffer, { name: 'qrcode.png' });
  await interaction.reply({ files: [attachment] });  
}