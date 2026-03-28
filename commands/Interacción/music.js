import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";

export const data = new SlashCommandBuilder()
.setName('music')
.setDescription('Reproduce música en un canal de voz.')
.addSubcommand(sub =>
  sub.setName('play')
  .setDescription('Reproduce música en un canal de voz.')
  .addStringOption(option =>
    option.setName('url')
    .setDescription('Link de la música a reproducir.')
    .setRequired(true)
  )
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
  // Crear el grupo de conexiones
  if (!client.voiceConnections) client.voiceConnections = new Map();
  
  client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.id !== client.user.id) return;
    
    const guildId = oldState.guild.id;
    const wasInVoice = oldState.channelId;
    const isInVoice = newState.channelId;
    
    if (wasInVoice && !isInVoice) {
      const connection = client.voiceConnections?.get(guildId);
      if (connection) {
        connection.destroy();
        client.voiceConnections.delete(guildId);
      }
    }
  })
  
  if (subcommand === 'play') {
    if (client.voiceConnections.has(interaction.guild.id)) {
      return interaction.reply({ content: '<:Advertencia:1302055825053057084> Ya estoy conectada en un canal de voz.', flags: 64, allowedMentions: { repliedUser: false }});
    }
    
    // Indicar que se está procesando la solicitud
    await interaction.deferReply();
    
    // Crear la conexión de voz
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });
    
    // Guardar conexión usando ID del servidor y confirmar la interacción
    client.voiceConnections.set(interaction.guild.id, connection);
    
    const reply = await interaction.editReply({ content: `<:Done:1326292171099345006> Conectada a <#${voiceChannel.id}>.`, allowedMentions: { repliedUser: false }});
    setTimeout(() => reply.delete(), 5000);
  }
  
  if (subcommand === 'leave') {
    const connection = client.voiceConnections.get(interaction.guild.id);
    const botChannel = connection.joinConfig.channelId;
    
    if (!connection) {
      return interaction.reply({ content: '<:Advertencia:1302055825053057084> No estoy conectada en ningún canal de voz.', flags: 64, allowedMentions: { repliedUser: false }});
    } else if (botChannel !== voiceChannel.id && !interaction.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
      return interaction.reply({ content: '<:Advertencia:1302055825053057084> No puedes desconectarme de otro canal de voz.', flags: 64, allowedMentions: { repliedUser: false }});
    }
    
    // Desconectar del canal y confirmar la interacción
    connection.destroy();
    client.voiceConnections.delete(interaction.guild.id);
    
    const reply = await interaction.reply({ content: `<:Done:1326292171099345006> Desconectada de <#${voiceChannel.id}>.`, flags: 64, allowedMentions: { repliedUser: false }});
    setTimeout(() => reply.delete(), 5000);
  }
}