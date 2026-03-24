import { SlashCommandBuilder } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";

export const data = new SlashCommandBuilder()
.setName('music')
.setDescription('Se conecta al canal de voz.')
.addSubcommand(sub =>
  sub.setName('play')
  .setDescription('Se conecta al canal de voz.')
)
.addSubcommand(sub =>
  sub.setName('leave')
  .setDescription('Se desconecta del canal de voz.')
)

export async function run(client, interaction) {
  const subcommand = interaction.options.getSubcommand();
  const voiceChannel = interaction.member?.voice?.channel;
  
  // Comprobar si el usuario está conectado en un canal de voz
  if (!voiceChannel) {
    return interaction.reply({ content: '<:Advertencia:1302055825053057084> Debes estar conectado en un canal de voz para usar este comando.', flags: 64, allowedMentions: { repliedUser: false }});
  }
  
  // Crear el grupo de conexiones si no existe
  if (!client.voiceConnections) client.voiceConnections = new Map();
  
  if (subcommand === 'play') {
    // Indicar que se está procesando la solicitud
    await interaction.deferReply();
    
    // Crear la conexión de voz
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });
    
    // Guardar conexión usando ID del servidor
    client.voiceConnections.set(interaction.guild.id, connection);
    
    // Confirmar la interacción
    const reply = await interaction.editReply({ content: `<:Done:1326292171099345006> Conectada a <#${voiceChannel.id}>.`, allowedMentions: { repliedUser: false }});
    setTimeout(() => reply.delete(), 5000);
  }
  
  if (subcommand === 'leave') {
    const connection = client.voiceConnections.get(interaction.guild.id);
    
    if (!connection) {
      return interaction.reply({ content: '<:Advertencia:1302055825053057084> No estoy conectada en ningún canal de voz.', flags: 64, allowedMentions: { repliedUser: false }});
    }
    
    // Desconectar de la voz
    connection.destroy();
    
    // Confirmar la interacción
    const reply = await interaction.reply({ content: `<:Done:1326292171099345006> Desconectado de <#${voiceChannel.id}>.`, flags: 64, allowedMentions: { repliedUser: false }});
    setTimeout(() => reply.delete(), 5000);
  }
}