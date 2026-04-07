import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { joinVoiceChannel, getVoiceConnection, createAudioResource, createAudioPlayer } from "@discordjs/voice";

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

async function playMusic(connection, url) {
  console.log(`${url}`);
  // Crear el reproductor de audio
  // const player = createAudioPlayer();
  // player.play(resource);
  // connection.subscribe(player);
}

export async function run(client, interaction) {
  try {
    const subcommand = interaction.options.getSubcommand();
    const voiceChannel = interaction.member?.voice?.channel;
    
    // Comprobar si el usuario está conectado en un canal de voz
    if (!voiceChannel) {
      return interaction.reply({ content: '<:Advertencia:1302055825053057084> Debes estar conectado en un canal de voz.', flags: 64, allowedMentions: { repliedUser: false }});
    }
    
    // Obtener la conexión de voz actual del servidor (si existe)
    const existingConnection = getVoiceConnection(interaction.guild.id);
    
    if (subcommand === 'play') {
      const url = interaction.options.getString('url');
      
      if (existingConnection) {
        const botChannelId = existingConnection.joinConfig.channelId;
        
        // Si el usuario no comparte canal de voz con el bot
        if (botChannelId !== voiceChannel.id) {
          return interaction.reply({ content: '<:Advertencia:1302055825053057084> Ya estoy conectada en otro canal de voz.', flags: 64, allowedMentions: { repliedUser: false }});
        }
        
        // Reproducir la música sin crear una nueva conexión
        playMusic(existingConnection, url);
        return interaction.reply({ content: `<:Done:1326292171099345006> Reproduciendo música en <#${voiceChannel.id}>.`, flags: 64, allowedMentions: { repliedUser: false }});
      }
      // Crear la conexión de voz si no existe ya
      await interaction.deferReply();
      
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
      });
      
      // Confirmar la interacción
      const reply = await interaction.editReply({ content: `<:Done:1326292171099345006> Conectada a <#${voiceChannel.id}>.`, allowedMentions: { repliedUser: false }});
      setTimeout(() => reply.delete(), 5000);
      
      playMusic(connection, url);
    }
    
    if (subcommand === 'leave') {
      if (!existingConnection) {
        return interaction.reply({ content: '<:Advertencia:1302055825053057084> No estoy conectada en ningún canal de voz.', flags: 64, allowedMentions: { repliedUser: false }});
      } 
      
      const botChannelId = existingConnection.joinConfig.channelId;
      
      if (botChannelId !== voiceChannel.id && !interaction.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
        return interaction.reply({ content: '<:Advertencia:1302055825053057084> No puedes desconectarme de otro canal de voz.', flags: 64, allowedMentions: { repliedUser: false }});
      }
      
      // Desconectar del canal y confirmar la interacción
      existingConnection.destroy();
      
      const reply = await interaction.reply({ content: `<:Done:1326292171099345006> Desconectada de <#${voiceChannel.id}>.`, flags: 64, allowedMentions: { repliedUser: false }});
      setTimeout(() => reply.delete(), 5000);
    }
  } catch (error) {
    interaction.editReply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar este comando.", allowedMentions: { repliedUser: false }});
    console.warn(error);
  }
}