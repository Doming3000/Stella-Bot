import { SlashCommandBuilder } from 'discord.js';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { parse } from 'twemoji-parser';
import { request } from 'undici';

export const data = new SlashCommandBuilder()
.setName('fake-message')
.setDescription('Genera una captura de un mensaje simulado.')
.addUserOption(option =>
  option.setName('usuario')
  .setDescription('Elige un usuario')
  .setRequired(true)
)
.addStringOption(option => 
  option.setName('contenido')
  .setDescription('Contenido del mensaje.')
  .setRequired(true)
);

// Parámetros similares a la interfaz de Discord
const parameters = {
  fontSize: 48,
  innerPadding: 48,
  userPictureSize: 140,
  userPictureRightMargin: 48,
  userNameBottomMargin: 18,
  messageContentWidth: 940,
  messageContentLineBottomMargin: 18,
  messageContentEmojisSize: 56,
  backgroundColor: '#36393f',
  fontColor: '#ffffff',
  lineWeight: 4,
};

// Registro de fuentes
const fonts = {
  bold: { path: 'assets/fonts/open-sans/OpenSans-Bold.ttf', name: 'Open Sans Bold' },
  regular: { path: 'assets/fonts/open-sans/OpenSans-Regular.ttf', name: 'Open Sans Regular' },
  semiBold: { path: 'assets/fonts/open-sans/OpenSans-SemiBold.ttf', name: 'Open Sans SemiBold' },
};

Object.values(fonts).forEach((font) => {
  GlobalFonts.registerFromPath(font.path, font.name);
});

// Calcular dimensiones del canvas
const canvasWidth = parameters.innerPadding * 4 + parameters.userPictureSize + parameters.userPictureRightMargin + parameters.messageContentWidth;
const canvasBaseHeight = parameters.innerPadding * 2 + parameters.userPictureSize;

// Función para obtener el nombre de usuario correcto
async function getDisplayName(interaction, user) {
  try {
    // Si está en un servidor
    if (interaction.guild) {
      const member = await interaction.guild.members.fetch(user.id);
      if (member && member.displayName) {
        return member.displayName;
      }
    }
    
    // Si no, obtener el nombre global
    return user.globalName || user.username;
  } catch (error) {
    console.error('Ha ocurrido un error: ', error);
    interaction.reply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar el comando.", flags: 64, allowedMentions: { repliedUser: false }});
  }
}

// Función para obtener el color del rol más alto del usuario
function getUserColor(interaction, user) {
  try {
    // Si es un mensaje directo, usar color blanco
    if (!interaction.guild) {
      return '#ffffff';
    }
    
    // Obtener miembro del servidor
    const member = interaction.guild.members.cache.get(user.id);
    
    // Si el usuario es miembro del servidor, usar el color del rol más alto del usuario
    if (member && member.roles.highest && member.roles.highest.color) {
      const colorHex = member.roles.highest.color.toString(16).padStart(6, '0');
      return `#${colorHex}`;
    }
    
    // Si no tiene roles o el rol no tiene color
    return '#ffffff';
  } catch (error) {
    console.error('Ha ocurrido un error: ', error);
    interaction.reply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar el comando.", flags: 64, allowedMentions: { repliedUser: false }});
  }
}

// Función run
export async function run(client, interaction) {  
  try {
    // Obtener usuario y contenido del mensaje
    const user = interaction.options.getUser('usuario');
    const messageContent = interaction.options.getString('contenido');
    
    // Obtener color del rol del usuario
    const userColor = getUserColor(interaction, user);
    
    // Crear canvas y contexto
    const canvas = createCanvas(canvasWidth, canvasBaseHeight);
    const context = canvas.getContext('2d');
    
    // Dibujar fondo
    context.fillStyle = parameters.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Configurar fuente y color para el nombre del usuario
    context.font = `${parameters.fontSize}px "${fonts.semiBold.name}"`;
    context.fillStyle = userColor;
    context.textBaseline = 'top';
    
    // Dibujar nombre de usuario
    const displayName = await getDisplayName(interaction, user);
    const userNamePosX = parameters.innerPadding + parameters.userPictureSize + parameters.userPictureRightMargin;
    const userNamePosY = parameters.innerPadding;
    context.fillText(displayName, userNamePosX, userNamePosY);
    
    // Dibujar el avatar
    const avatarPosX = parameters.innerPadding;
    const avatarPosY = parameters.innerPadding;
    const avatarURL = user.displayAvatarURL({ extension: 'png', size: 128 });
    
    const response = await request(avatarURL);
    const buffer = Buffer.from(await response.body.arrayBuffer());
    const avatarImage = await loadImage(buffer);
    
    // Recorte circular del avatar
    context.save();
    context.beginPath();
    const arcRadius = parameters.userPictureSize / 2;
    context.arc(avatarPosX + arcRadius, avatarPosY + arcRadius, arcRadius, 0, Math.PI * 2);
    context.closePath();
    context.clip();
    
    // Dibujar el avatar
    context.drawImage(avatarImage, avatarPosX, avatarPosY, parameters.userPictureSize, parameters.userPictureSize);
    
    context.restore();
    
    // Dibujar contenido del mensaje
    context.font = `${parameters.fontSize}px "${fonts.regular.name}"`;
    context.fillStyle = parameters.fontColor;
    const messagePosX = userNamePosX;
    const messagePosY = userNamePosY + parameters.fontSize + parameters.userNameBottomMargin;
    context.fillText(messageContent, messagePosX, messagePosY);
    
    // Exportar imagen
    const attachment = canvas.toBuffer('image/png');
    
    interaction.reply({ content: "<:Advertencia:1302055825053057084> **Este comando aún se encuentra en desarollo, puede presentar errores o estar incompleto.**", files: [{ attachment, name: 'fake-message.png' }], allowedMentions: { repliedUser: false } });
  } catch (error) {
    console.error('Ha ocurrido un error: ', error);
    interaction.reply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar el comando.", flags: 64, allowedMentions: { repliedUser: false }});
  }
}