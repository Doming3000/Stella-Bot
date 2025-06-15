import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import os from "os"

export const data = new SlashCommandBuilder()
.setName('botping')
.setDescription('Muestra la latencia y estado del bot.')

export function run(client, interaction) {
  // Obtener información del entorno
  const memoryUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const usedMem = memoryUsage.rss;
  const cpuLoad = os.loadavg()[0]; // Promedio de carga del CPU (último minuto)
  
  const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  
  const embed = new EmbedBuilder()
  .setColor(0x779ecb)
  .setAuthor({ name: `${client.user.username} - ${interaction.commandName}`, iconURL: client.user.displayAvatarURL()})
  .setTitle('🏓 ¡Pong!')
  .setDescription(`- 📡 Ping:\`${client.ws.ping}ms\`.\n- 🧠 Uso de memoria: \`${formatBytes(usedMem)} / ${formatBytes(totalMem)}\`\n- 🤖 Carga del CPU (último minuto): \`${cpuLoad.toFixed(2)}\``)
  
  interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
}