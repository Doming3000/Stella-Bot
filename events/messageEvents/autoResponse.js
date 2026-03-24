import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from "discord.js";

export async function handleMessage(message, client) {
  const targetGuilds = ['787098787881287711', '1396375735425564754'];
  const content = message.content.toLowerCase();
  
  // Ignorar mensajes de bots y otros servidores
  if (message.author.bot || !targetGuilds.includes(message.guild.id)) return;
  
  // Contenedor de botones
  const actionRow = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
    .setCustomId('delete')
    .setLabel('Quitar respuesta')
    .setStyle(ButtonStyle.Danger)
  );
  
  // Colector para la respuesta
  async function responseColector(sentMessage, authorId) {
    const collector = sentMessage.createMessageComponentCollector({ time: 2 * 60 * 1000 });
    
    collector.on('collect', async i => {
      if (i.customId === 'delete') {
        // Asegurarse de que solo el usuario que envió el mensaje pueda eliminar la respuesta (a menos que tenga permisos para eliminar mensajes)
        if (i.user.id !== authorId && !i.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
          return i.reply({ content: `<:Advertencia:1302055825053057084> <@${i.user.id}> No tienes permisos para realizar esta acción.`, flags: 64, allowedMentions: { repliedUser: false }});
        }
        
        // Eliminar el mensaje
        collector.stop();
        await sentMessage.delete();
        console.log(`📃  - Se ha quitado un mensaje de respuesta a ${authorId}. "${message.content}"`);
      }
    });
    
    // Finalizar el colector
    collector.on('end', async () => {
      await sentMessage.edit({ components: [] }).catch(() => {});
    });
  }
  
  // Función para responder
  async function reply(message, options) {
    message.channel.sendTyping();
    await new Promise(resolve => setTimeout(resolve, 1500)); // Delay de 1.5 segundos.
    const sentMessage = await message.reply(options);
    await responseColector(sentMessage, message.author.id);
    return sentMessage;
  }
  
  // Comprobar contenido del mensaje y responder
  try {
    switch (true) {
      // Plantilla
      // case ["", ""].some(word => content.includes(word)):
      // await reply(message, { content: "", components: [actionRow], allowedMentions: { repliedUser: false }});
      // break;
      
      // Dudas sobre como suscribirse
      case["como me suscribo", "como suscribirse", "como suscribirme", "quiero suscribirme"].some(word => content.includes(word)):
      await reply(message, { content: "### <:Info:1345848332760907807> Como suscribirse a un manga\nPara suscribirte a un manga tienes que ejecutar el comando </manga-notify subscribe:1377840648761118822>, brindando como parámetro la URL del manga al que deseas suscribirte.\n### 📋 Ejemplo de uso:\n```/manga-notify subscribe https://zonatmo.com/library/manga/3581/spyxfamily```", components: [actionRow], allowedMentions: { repliedUser: false }});
      break;
      
      default:
      break;
    }
  } catch (error) {
    console.log(`No se ha podido responder al mensaje de ${message.id}. "${message.content}": `, error);
  }
}