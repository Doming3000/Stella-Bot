import { getVoiceConnection } from "@discordjs/voice";

export function voiceStateUpdate(client) {
  client.on("voiceStateUpdate", (oldState, newState) => {
    // Ignorar actualizaciones que no involucren al bot
    if (newState.member.id !== client.user.id) return;
    
    const guildId = newState.guild.id;
    const connection = getVoiceConnection(guildId);
    
    // Si no hay conexión, no hay nada que actualizar o destruir
    if (!connection) return;
    
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;
    
    // Escenario 1: Bot expulsado del canal
    if (oldChannel && !newChannel) {
      return connection.destroy();
    }
    
    // Escenario 2: Bot movido a otro canal
    if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {    
      // Crear una nueva conexión en el nuevo canal
      connection.rejoin({
        channelId: newChannel.id,
        guildId: newChannel.guild.id,
        adapterCreator: newChannel.guild.voiceAdapterCreator
      });
      return;
    }
  });
}