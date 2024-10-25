import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { version as discordVersion } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

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

const data = new SlashCommandBuilder()
.setName('botinfo')
.setDescription('Muestra información del bot.');

async function run(client, interaction) {
  const uptime = Math.floor((new Date().getTime() - client.uptime) / 1000);
  
  const embed = new EmbedBuilder()
  .setColor(0x779ecb)
  .setAuthor({
    name: `${client.user.username} - ${interaction.commandName}`,
    iconURL: client.user.displayAvatarURL()
  })
  .setTitle("🔎 Información de la aplicación:")
  .setDescription(`**¡Hola!**\nSoy una aplicación privada diseñada para servidores de confianza.\nFui puesta en línea <t:${uptime}:R> y cuento con **${commandCount}** comandos.`)
  .addFields(
    { name: "📚 - Versiones", value: `➜ <:Discord:1013285425412046929> **Discord.js**: \`${discordVersion}\`\n➜ <:Nodejs:1013283193484484608> **Node.js**: \`${nodeVersion}\``, inline: true },
    { name: "📃 - Información Adicional:", value: "➜ <:Code:1299227551180259350> Programado con **Javascript**\n➜ :technologist: Desarollado por: <@811071747189112852>", inline: true }
  );
  
  await interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
}

export { data, run };