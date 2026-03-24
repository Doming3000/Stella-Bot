import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import pidusage from "pidusage";
import os from "os"

export const data = new SlashCommandBuilder()
.setName('botping')
.setDescription('Muestra la latencia del bot.')

export async function run(client, interaction) {
  // Obtener información del entorno
  const stats = await pidusage(process.pid);
  const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
  const uptime = Math.floor((new Date().getTime() - client.uptime) / 1000);
  
  const embed = new EmbedBuilder()
  .setColor(0x779ecb)
  .setAuthor({ name: `${client.user.username} - ${interaction.commandName}`, iconURL: client.user.displayAvatarURL()})
  .setTitle('🏓 ¡Pong!')
  .setDescription(`- 📡 - Ping: \`${client.ws.ping}ms\`\n- 📆 - Uptime: <t:${uptime}:f>\n- 🧠 - Uso de memoria: \`${formatBytes(stats.memory)} / 512 MiB\`\n- 🤖 - Uso del CPU: \`${stats.cpu.toFixed(2)}%\``)
  
  interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
}