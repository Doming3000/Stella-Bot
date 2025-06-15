import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import os from "os"

export const data = new SlashCommandBuilder()
.setName('botping')
.setDescription('Muestra la latencia y estado del bot.')

export function run(client, interaction) {
  const memoryUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const usedMem = memoryUsage.rss;
  const cpuLoad = os.loadavg()[0]; // Promedio de carga del CPU (último minuto)
  const uptime = process.uptime(); // En segundos
  
  const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${h}h ${m}m ${s}s`;
  };
  
  const embed = new EmbedBuilder()
  .setColor(0x779ecb)
  .setAuthor({ name: `${client.user.username} - ${interaction.commandName}`, iconURL: client.user.displayAvatarURL()})
  .setTitle('🏓 ¡Pong!')
  .setDescription(`- 📡 Mi ping actual es \`${client.ws.ping}ms\`.\n- 🧠 Uso de memoria: \`${formatBytes(usedMem)} / ${formatBytes(totalMem)}\`\n- ⚙️ Carga del CPU (1min): \`${cpuLoad.toFixed(2)}\`\n- ⏱️ Uptime: \`${formatTime(uptime)}\``)
  
  interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
}