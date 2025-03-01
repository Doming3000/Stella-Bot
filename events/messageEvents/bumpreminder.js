import { WebhookClient } from 'discord.js';
import { query } from '../../database.js';
import { CronJob } from "cron";
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Webhook para enviar mensajes
const webhook = new WebhookClient({ id: '1345083112094302339', token: process.env.WH_TOKEN });

export async function handleMessage(message, client) {
  // ID de Disboard y canal destinado a Bumpear
  const disboardID = '302050872383242240';
  const bumpChannels = '1311440187141656687';
  
  // Verificar si el mensaje es de Disboard y contiene embeds
  if (message.author.id !== disboardID || message.embeds.length === 0) return;
  
  // Obtener el primer embed del mensaje y comprobar su contenido
  const embed = message.embeds[0];
  const embedContent = 'Bump done!';
  
  // Si el contenido del embed no es el esperado, salir de la función
  if (!embed.description?.includes(embedContent)) return;
  
  // Comprobar si el mensaje fue enviado en el canal correcto
  if (message.channel.id !== bumpChannels) {
    await message.channel.send({ content: "**¡Canal equivocado!** Eso no está bien... [Es hora del castigo...](https://tenor.com/view/the-amazing-digital-circus-caine-cellar-into-the-cellar-you-go-digital-circus-gif-15816184000111723724) <@1318394391915925537>" });
    return;
  }
  
  // Si el bump se realizó correctamente, calcular el tiempo para el próximo bump
  const now = Date.now();
  const futureTimestamp = now + 2 * 60 * 60 * 1000;
  const futureTimestampInSeconds = `<t:${Math.floor(futureTimestamp / 1000)}:R>`;
  
  try {
    // Enviar un mensaje de agradecimiento al canal
    const thanksMessage = await webhook.send({ content: `**¡Muchas gracias por bumpearnos!** Toma una galleta <:Cookies:1345267507229102142>\nRecuerda regresar ${futureTimestampInSeconds} para el siguiente bump.`, username: "🚀 Bump Reminder"});
    
    // Insertar o actualizar el recordatorio en la base de datos
    await insertReminder(bumpChannels, futureTimestamp, thanksMessage.id);
    console.log(`📃  - Se ha añadido un recordatorio para las ${new Date(futureTimestamp).toISOString()}. Motivo: Servidor bumpeado.`);
    
    // Programar el recordatorio
    programReminder(futureTimestamp, message.channel);
  } catch (err) {
    console.error("📃  - Ha ocurrido un error al registrar el recordatorio en la base de datos:", err);
  }
}

// Función para enviar el recordatorio del próximo bump después de un tiempo
async function sendBumpReminder(channel) {
  try {
    // Recuperar el registro del recordatorio en la base de datos
    const [record] = await query("SELECT message_id FROM bumps WHERE channel_id = ?", [channel.id]);
    
    // Obtener el mensaje anterior a partir de su ID
    const messageToDelete = await channel.messages.fetch(record.message_id).catch(() => null);
    
    // Si no se encuentra el mensaje, se asume que se perdió y se borra el registro.
    if (!messageToDelete) {
      console.warn(`📃  - No se pudo encontrar el mensaje con la ID en el canal ${channel.id}.`);
      await deleteReminder(channel.id);
      return;
    }
    
    // Eliminar el mensaje anterior y enviar un mensaje de recordatorio
    await Promise.all([
      await messageToDelete.delete(),
      webhook.send({ content: "**¡Es hora de bumpear!\n<:DiscordSlashCommand:1345270704983113788>﹕</bump:947088344167366698>**", username: "🚀 Bump Reminder"})
    ]);
    
    // Eliminar el registro de la base de datos después de enviar el recordatorio
    await deleteReminder(channel.id);
    console.log(`📃  - Se ha enviado el recordatorio y eliminado el registro para el canal ${channel.id}.`);
  } catch (error) {
    console.error("📃  - Ha ocurrido un error al enviar el recordatorio:", error);
  }
}

// Función para recuperar registros pendientes al reiniciarse el bot
export async function checkPendingBumps(client) {
  try {
    // Consultar la base de datos en busca de registros pendientes
    const rows = await query("SELECT channel_id, next_bump FROM bumps");
    
    console.log(`📃  - Se ${rows.length === 1 ? 'encontró' : 'encontraron'} ${rows.length} ${rows.length === 1 ? 'recordatorio' : 'recordatorios'} en la base de datos.`);
    
    rows.forEach(async ({ channel_id, next_bump }) => {
      const channel = await client.channels.fetch(channel_id).catch(err => {
        console.warn(`📃  - No se pudo encontrar el canal con ID: ${channel_id}. Error: ${err.message}`);
        return null;
      });
      
      if (!channel) return;
      
      // Si hay un próximo bump programado, programar su envío
      if (next_bump > Date.now()) {
        programReminder(next_bump, channel);
      } else {
        // Si el registro ya está vencido se elimina
        await deleteReminder(channel_id);
        console.log(`📃  - Registro eliminado para el canal ${channel_id}. Motivo: Vencimiento.`);
      }
    });
  } catch (error) {
    console.error("📃  - Ha ocurrido un error al verificar los bumps pendientes:", error);
  }
}

// Función para insertar o actualizar un registro en la base de datos
async function insertReminder(channelId, nextBump, messageId) {
  await query( "INSERT INTO bumps (channel_id, next_bump, message_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE next_bump = ?, message_id = ?", [channelId, nextBump, messageId, nextBump, messageId]);
}

// Función para eliminar un registro de la base de datos
async function deleteReminder(channelId) {
  await query("DELETE FROM bumps WHERE channel_id = ?", [channelId]);
}

// Función para programar el recordatorio con Cron
async function programReminder(futureTimestamp, channel) {
  const job = new CronJob(new Date(futureTimestamp), async () => {
    await sendBumpReminder(channel);
    job.stop();
  });
  
  job.start();
}