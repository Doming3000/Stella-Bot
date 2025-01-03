export async function handleMessage(message) {
  // ID de Disboard y canales destinados a Bumpear
  const disboardID = '302050872383242240';
  const bumpChannels = '1311440187141656687';
  
  // Comprobar si el autor del mensaje es Disboard
  if (message.author.id === disboardID) {
    // Comprobar si el mensaje contiene un embed
    if (message.embeds.length > 0) {
      // Obtener el embed del mensaje
      const embed = message.embeds[0];
      
      // Comprobar contenido del embed
      const embedContent = 'Bump done!';
      
      // Si el mensaje contiene el contenido correcto, se asume que el bump se realizó correctamente
      if (embed.description?.includes(embedContent)) {
        // Verificar si el bump se realizó en el canal correcto
        if (message.channel.id === bumpChannels) {
          // Obtener el timestamp actual en milisegundos
          const now = Date.now();
          
          // Añadir 2 horas (2 * 60 * 60 * 1000 milisegundos)
          const futureTimestamp = now + 2 * 60 * 60 * 1000;
          
          // Convertir el timestamp a segundos para Discord
          const futureTimestampInSeconds = Math.floor(futureTimestamp / 1000);
          
          // Enviar mensaje de felicitación al canal
          message.channel.send({ content: `**¡Muchas gracias por bumpearnos!** Toma una galleta <:Cookies:1324082997850275875>\nRecuerda regresar <t:${futureTimestampInSeconds}:R> para el siguiente bump.`});
          
          // Programar mensaje para después de 2 horas (reemplazar por sistema que trabaje con base de datos)
          setTimeout(() => {
            message.channel.send({ content: `**¡Es hora de Bumpear!\n<:DiscordSlashCommand:1302071335987707924>﹕</bump:947088344167366698>**`});
          }, 2 * 60 * 60 * 1000);
        } else {
          message.channel.send({ content: "**¡Canal equivocado!** Eso no está bien... [Es hora del castigo...](https://tenor.com/view/the-amazing-digital-circus-caine-cellar-into-the-cellar-you-go-digital-circus-gif-15816184000111723724) <@1318394391915925537>" });
        }
      }
    }
  }
}

// Pendiente a realizar:
// Envíar mensaje mediante webhook y no mediante la app
// Bloquear y desbloquear el canal según si el servidor es bumpeable o no
// Considerar si notificar a algún rol al momento de notificar