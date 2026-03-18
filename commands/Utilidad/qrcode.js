import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import qrcode from "qrcode";

export const data = new SlashCommandBuilder()
.setName('qrcode')
.setDescription('Genera un código QR para una dirección URL.')
.addStringOption(option =>
  option.setName('url')
  .setDescription('URL a codificar.')
  .setRequired(true)
)
.addStringOption(option =>
  option.setName('level')
  .setDescription('Nivel de corrección de errores (opcional, por defecto: Medio).')
  .setRequired(false)
  .addChoices(
    { name: 'Bajo', value: 'L' },
    { name: 'Medio', value: 'M' },
    { name: 'Alto', value: 'Q' },
    { name: 'Máximo', value: 'H' }
  )
)
.addIntegerOption(option =>
  option.setName('scale')
  .setDescription('Tamaño de la imagen (opcional, por defecto: 10).')
  .setRequired(false)
  .setMinValue(4)
  .setMaxValue(15)
)
.addIntegerOption(option =>
  option.setName('margin')
  .setDescription('Margen del código QR (opcional, por defecto: 5).')
  .setRequired(false)
  .setMinValue(1)
  .setMaxValue(20)
)
.addStringOption(option =>
  option.setName('name')
  .setDescription('Nombre del archivo (opcional, por defecto: qrcode).')
  .setRequired(false)
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

// Función para limpiar el nombre del archivo
function cleanFileName(name) {
  if (!name) {
    return 'qrcode';
  }
  
  return name.replace(/[^a-zA-Z0-9]/g, '');
}

export async function run(client, interaction) {
  const url = interaction.options.getString('url');
  const level = interaction.options.getString('level');
  const scale = interaction.options.getInteger('scale');
  const margin = interaction.options.getInteger('margin');
  const name = cleanFileName(interaction.options.getString('name'));
  
  // Verificar si el valor proporcionado es una URL válida.
  if (!isValidURL(url)) {
    await interaction.reply({ content: "<:Advertencia:1302055825053057084> Debes proporcionar una URL válida.", flags: 64, allowedMentions: { repliedUser: false } });
    return;
  }
  
  // Valores por defecto si no se proporcionan
  else if (!level) {
    level = 'M';
  }
  
  else if (!scale) {
    scale = 10;
  }
  
  else if (!margin) {
    margin = 5;
  }
  
  // Generar el código QR y envíar el mensaje
  const qrCode = await qrcode.toDataURL(url, {
    errorCorrectionLevel: level,
    scale: scale,
    margin: margin
  });
  
  const base64Data = qrCode.replace(/^data:image\/png;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");
  
  const attachment = new AttachmentBuilder(imageBuffer, { name: `${name}.png` });
  await interaction.reply({ files: [attachment] });  
}