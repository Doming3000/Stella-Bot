import { query } from '../../database.js';
import schedule from "node-schedule";

export async function handleMessage(message) {
  // ID de Disboard y canales destinados a Bumpear
  const disboardID = '302050872383242240';
  const bumpChannels = '1311440187141656687';
  
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
          const futureTimestamp = now + 2 * 60 * 60 * 1000;
          
          try {
            // Convertir el timestamp a segundos para Discord
            const futureTimestampInSeconds = Math.floor(futureTimestamp / 1000);
            
            // Enviar mensaje de agradecimiento al canal en el momento del bump
            const thanksMessage = await message.channel.send({ content: `**¡Muchas gracias por bumpearnos!** Toma una galleta <:Cookies:1324082997850275875>\nRecuerda regresar <t:${futureTimestampInSeconds}:R> para el siguiente bump.` });
            
            // Registrar el bump en la base de datos, actualizando el próximo bump si es necesario
            await query("INSERT INTO bumps (channel_id, next_bump, message_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE next_bump = ?, message_id = ?", [bumpChannels, futureTimestamp, thanksMessage.id, futureTimestamp, thanksMessage.id]);
            
            // Programar recordatorio con node-schedule
            schedule.scheduleJob(new Date(futureTimestamp), async () => {
              const actualNow = Date.now();
              console.log(`📃  - Recordatorio ejecutado. Retraso de: ${actualNow - futureTimestamp} ms`);
              
              await sendBumpReminder(message.channel);
            });
            
            console.log(`📃  - Se ha añadido un recordatorio en la base de datos para las ${new Date(futureTimestamp).toISOString()}`);
          } catch (err) {
            console.error("Ha ocurrido un error al intentar registrar el recordatorio en la base de datos:", err);
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
    // Recuperar el registro del bump en la base de datos
    const [record] = await query("SELECT message_id FROM bumps WHERE channel_id = ?", [channel.id]);
    if (!record?.message_id) {
      console.warn(`📃  - No se encontró un mensaje para editar en el canal ${channel.id}.`);
      return;
    }
    
    // Obtener el mensaje anterior a partir de su ID
    const messageToEdit = await channel.messages.fetch(record.message_id).catch(() => null);
    if (!messageToEdit) {
      console.warn(`📃  - No se pudo encontrar el mensaje con la ID ${record.message_id} en el canal ${channel.id}.`);
    } else {
      // Editar el mensaje anterior
      await messageToEdit.edit({ content: "**¡Muchas gracias por bumpearnos!** Toma una galleta <:Cookies:1324082997850275875>" });
    }
    
    // Enviar un nuevo mensaje de recordatorio
    await channel.send({ content: "**¡Es hora de bumpear!\n<:DiscordSlashCommand:1302071335987707924>﹕</bump:947088344167366698>**" });
    
    // Eliminar el registro de la base de datos
    await query("DELETE FROM bumps WHERE channel_id = ?", [channel.id]);
    console.log(`📃  - Se ha eliminado un registro para el canal ${channel.id}. Motivo: Recordatorio enviado.`);
  } catch (error) {
    console.error("📃  - Ha ocurrido un error al enviar el recordatorio:", error);
  }
}

// Función para recuperar registros pendientes al reiniciarse el bot
export async function checkPendingBumps(client) {
  const now = Date.now();
  
  try {
    // Consultar la base de datos en busca de registros pendientes
    const rows = await query("SELECT channel_id, next_bump, message_id FROM bumps");
    
    // Verificar cuántos registros hay en la base de datos
    console.log(`📃  - Se ${rows.length === 1 ? 'encontró' : 'encontraron'} ${rows.length} ${rows.length === 1 ? 'recordatorio pendiente' : 'recordatorios pendientes'} en la base de datos.`);
    
    rows.forEach(async (row) => {
      const { channel_id, next_bump } = row;
      const channel = await client.channels.fetch(channel_id).catch((err) => {
        console.warn(`📃  - No se pudo encontrar el canal con ID: ${channel_id}. Error: ${err.message}`);
        return null;
      });
      
      if (channel) {
        if (next_bump > now) {
          schedule.scheduleJob(new Date(next_bump), async () => {
            await sendBumpReminder(channel);
          });
        } else {
          // Si el registro ya está vencido se elimina
          await query("DELETE FROM bumps WHERE channel_id = ?", [channel.id]);
          console.log(`📃  - Se ha eliminado un registro para el canal ${channel_id}. Motivo: Vencimiento.`);
        }
      } else {
        console.warn(`📃  - No se pudo acceder al canal con la ID: ${channel_id}`);
      }
    });
  } catch (error) {
    console.error("📃  - Ha ocurrido un error al verificar los bumps pendientes:", error);
  }
}

// Pendiente a realizar:
// Considerar si envíar mensaje mediante webhook y no mediante la app
// Bloquear y desbloquear el canal según si el servidor es bumpeable o no