import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { version as discordVersion } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export const data = new SlashCommandBuilder()
.setName('botinfo')
.setDescription('Muestra información del bot.');

// Función para contar los archivos de comandos en subdirectorios
function countCommandFiles(dir) {
  let fileCount = 0;
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      fileCount += countCommandFiles(filePath);
    } else if (file.endsWith('.js')) {
      fileCount++;
    }
  });
  
  return fileCount;
}

// Contar la cantidad de comandos dinámicamente
const commandCount = countCommandFiles('./commands');

// Obtener la versión de Node.js
const nodeVersion = process.version;

// Función para obtener al propietario
async function getOwner(interaction) {
  const ownerName = '**Doming3000**';
  
  // Comprobar si existe un canal de interacción. Si no, se asume que es un mensaje directo
  if (!interaction.guild) return ownerName;
  
  try {
    // Intentar encontrar al usuario en el servidor mediante su ID
    const member = await interaction.guild.members.fetch('811071747189112852');
    return `<@${member.id}>`;
  } catch (error) {
    return ownerName;
  }
}

export async function run(client, interaction) {
  const uptime = Math.floor((new Date().getTime() - client.uptime) / 1000);
  const ownerMention = await getOwner(interaction);
  
  const embed = new EmbedBuilder()
  .setColor(0x779ecb)
  .setAuthor({ name: `${client.user.username} - ${interaction.commandName}`, iconURL: client.user.displayAvatarURL()})
  .setTitle("🔎 Información de la aplicación")
  .setDescription(`**¡Hola!**\nSoy una aplicación privada diseñada para servidores de confianza.\nLlevo en funcionamiento desde <t:${uptime}:R> y cuento con **${commandCount}** comandos.`)
  .addFields(
    { name: "📚 - Versiones", value: `➜ <:Discord:1302057111550824561> **Discord.js**: \`${discordVersion}\`\n➜ <:Nodejs:1302056618971889757> **Node.js**: \`${nodeVersion}\``, inline: true },
    { name: "📃 - Información adicional", value: `➜ <:Javascript:1302106857724448872> Programado con **JavaScript**\n➜ :technologist: Desarollado por: ${ownerMention}`, inline: true }
  );
  
  await interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
}