import { query } from '../../database.js';

export async function handleMessage(message) {
  // ID de Disboard y canales destinados a Bumpear
  // const disboardID = '302050872383242240';
  // const bumpChannels = '1311440187141656687';
  const disboardID = '1324882956917018755';
  const bumpChannels = '1324882908065955901';
  
  if (message.author.id === disboardID) {
    if (message.embeds.length > 0) {
      // Obtener el embed del mensaje y comprobar su contenido
      const embed = message.embeds[0];
      const embedContent = 'Bump done!';
      
      // Si el mensaje tiene el contenido correcto, se asume que el bump se realizó correctamente
      if (embed.description?.includes(embedContent)) {
        if (message.channel.id === bumpChannels) {
          // Obtener el timestamp actual en milisegundos y añadir 2 horas para el recordatorio
          const now = Date.now();
          // const futureTimestamp = now + 2 * 60 * 60 * 1000;
          const futureTimestamp = now + 1 * 60 * 1000;
          
          try {
            // Registrar el bump en la base de datos, actualizando el próximo bump si es necesario
            await query("INSERT INTO bumps (channel_id, next_bump) VALUES (?, ?) ON DUPLICATE KEY UPDATE next_bump = ?", [bumpChannels, futureTimestamp, futureTimestamp]);
            
            const futureTimestampInSeconds = Math.floor(futureTimestamp / 1000);
            
            // Enviar mensaje de agradecimiento al canal en el momento del bump
            await message.channel.send({ content: `**¡Muchas gracias por bumpearnos!** Toma una galleta <:Cookies:1324082997850275875>\nRecuerda regresar <t:${futureTimestampInSeconds}:R> para el siguiente bump.` });
            
            // Configurar setTimeout para enviar el recordatorio
            setTimeout(async () => {
              await sendBumpReminder(message.channel);
            }, futureTimestamp - now);
            
          } catch (err) {
            console.error("Ha ocurrido un error al intentar registrar el bump en la base de datos:", err);
          }
        } else {
          // Si el bump se realiza en el canal equivocado, envíar mensaje
          message.channel.send({ content: "**¡Canal equivocado!** Eso no está bien... [Es hora del castigo...](https://tenor.com/view/the-amazing-digital-circus-caine-cellar-into-the-cellar-you-go-digital-circus-gif-15816184000111723724) <@1318394391915925537>" });
        }
      }
    }
  }
}

// Función para enviar el recordatorio del próximo bump
async function sendBumpReminder(channel) {
  try {
    // Enviar mensaje de recordatorio una vez trasncurra el tiempo
    await channel.send({ content: "**¡Es hora de bumpear!\n<:DiscordSlashCommand:1302071335987707924>﹕</bump:947088344167366698>**" });
    
    // Eliminar el registro del bump de la base de datos
    await query("DELETE FROM bumps WHERE channel_id = ?", [channel.id]);
  } catch (error) {
    console.error("Ha ocurrido un error al enviar el recordatorio:", error);
  }
}

// Función para recuperar bumps pendientes al reiniciarse el bot
export async function checkPendingBumps(client) {
  const now = Date.now();
  
  try {
    // Consultar la base de datos en busca de bumps pendientes
    const rows = await query("SELECT channel_id, next_bump FROM bumps");
    
    // Verificar cuantos bumps hay en la base de datos
    console.log(`Se encontraron ${rows.length} bumps en la base de datos.`);
    
    for (const row of rows) {
      const { channel_id, next_bump } = row;
      const delay = next_bump - now;
      
      const channel = await client.channels.fetch(channel_id).catch(err => {
        console.warn(`No se pudo encontrar el canal con ID: ${channel_id}. Error: ${err.message}`);
        return null;
      });
      
      if (channel) {
        if (delay > 0) {
          // Si el bump está en el futuro, programa un `setTimeout`
          console.log(`Configurando recordatorio para el canal ${channel_id} en ${delay} ms.`);
          setTimeout(async () => {
            await sendBumpReminder(channel);
          }, delay);
        } else {
          // Si el bump ya está vencido, eliminarlo.
          await query("DELETE FROM bumps WHERE channel_id = ?", [channel.id]);
        }
      } else {
        console.warn(`No se pudo acceder al canal con la ID: ${channel_id}`);
      }
    }
  } catch (error) {
    console.error("Ha ocurrido un error al verificar los bumps pendientes:", error);
  }
}