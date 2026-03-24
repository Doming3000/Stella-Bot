import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import qrcode from "qrcode";

export const data = new SlashCommandBuilder()
.setName('qrcode')
.setDescription('Genera un código QR.')
.addStringOption(option =>
  option.setName('content')
  .setDescription('Contenido a codificar.')
  .setRequired(true)
  .setMaxLength(2000)
)
.addStringOption(option =>
  option.setName('level')
  .setDescription('Nivel de corrección de errores (Por defecto: Medio).')
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
  .setDescription('Tamaño de la imagen (Por defecto: 8).')
  .setRequired(false)
  .setMinValue(4)
  .setMaxValue(15)
)
.addIntegerOption(option =>
  option.setName('margin')
  .setDescription('Margen del código QR (Por defecto: 4).')
  .setRequired(false)
  .setMinValue(1)
  .setMaxValue(20)
)
.addStringOption(option =>
  option.setName('name')
  .setDescription('Nombre del archivo (Por defecto: qrcode).')
  .setRequired(false)
  .setMaxLength(255)
);

// Función para limpiar el nombre del archivo
function cleanFileName(name) {
  if (!name) return 'qrcode';
  
  // Acentos y caracteres inválidos (_). Solo alfanuméricos. No multiples espacios. No espacios al inicio/final. Si queda vacío, usar qrcode. 
  return name.normalize("NFD").replace(/[\u0300-\u036f\\\/:*?"<>|]/g, "_").replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, " ") .trim() || 'qrcode';
}

export async function run(client, interaction) {
  try {
    const content = interaction.options.getString('content');
    const level = interaction.options.getString('level') || 'M';
    const scale = interaction.options.getInteger('scale') || 8;
    const margin = interaction.options.getInteger('margin') || 4;
    const name = cleanFileName(interaction.options.getString('name'));
    
    // Generar el código QR y envíar el mensaje
    const qrCode = await qrcode.toDataURL(content, {
      errorCorrectionLevel: level,
      scale: scale,
      margin: margin
    });
    
    const base64Data = qrCode.replace(/^data:image\/png;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    
    const attachment = new AttachmentBuilder(imageBuffer, { name: `${name}.png` });
    await interaction.reply({ files: [attachment] });
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al generar el código QR.", flags: 64, allowedMentions: { repliedUser: false }});
  }
}