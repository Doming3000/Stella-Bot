import { ActionRowBuilder, ButtonBuilder } from "discord.js";

export async function handleMessage(message, interaction, client) {
  // Ignorar mensajes de bots
  if (message.author.bot) return;
  
  const content = message.content.toLowerCase();
  
  // Botón para eliminar el mensaje
  const actionRow = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
    .setEmoji("<:Quitar:1345873883269435483>")
    .setCustomId("deleteMessage")
    .setLabel("Falso positivo")
    .setStyle("Danger")
  );
  
  // Timeout para eliminar los botones después de 5 minutos
  async function removeButtons(sentMessage) {
    setTimeout(async () => {
      try {        
        // Obtener el mensaje para comprobar si ya fue eliminado
        const fetchedMessage = await sentMessage.channel.messages.fetch(sentMessage.id).catch(() => null);
        if (!fetchedMessage) return;
        
        await fetchedMessage.edit({ components: [] });
      } catch (error) {
        console.error("Ha ocurrido un error al eliminar los botones:", error);
      }
      // 5 minutos
    }, 5 * 60 * 1000);
  }
  
  // Comprobar contenido de mensajes
  try {
    // Variable para guardar el mensaje
    let sentMessage;
    
    switch (true) {
      // Dudas sobre el canal de bumpeo
      case ["que es bump", "que cosa es bump", "para que sirve bump", "que se hace en bump"].some(word => content.includes(word)):      
      sentMessage = await message.reply({ content: "### <:Info:1345848332760907807> ¿Qué es Disboard y para qué sirve?\n[Disboard](https://disboard.org/es) es una página web donde uno puede encontrar servidores de Discord. Para que los servidores resalten más y no se pierdan en las profundidades del sitio, estos tienen que ser bumpeados por sus usuarios cada 2 horas. Para esto se emplea el canal de <#1311440187141656687>.", components: [actionRow], allowedMentions: { repliedUser: false } });
      removeButtons(sentMessage);
      break;
      
      // Dudas sobre la whitelist
      case ["me agregan a la whitelist", "me agregen a la whitelist", "me agregas a la whitelist", "no estoy en la whitelist", "estar en la whitelist"].some(word => content.includes(word)):
      sentMessage = await message.reply({ content: "### <:Info:1345848332760907807> Como funciona la whitelist:\nAl tratarse de un servidor no premium, la whitelist no funcionará correctamente únicamente con tu nick de jugador, para garantizar tu ingreso asegúrate de estar disponible a la vez que un administrador del servidor para que pueda apagar la whitelist temporalmente y así permitir tu ingreso.\n### Pedimos diculpas por los inconvenientes y posibles largos tiempos de espera.", components: [actionRow], allowedMentions: { repliedUser: false } });
      removeButtons(sentMessage);
      break;
      
      // Evitar mensajes molestos
      case ["dead chat", "chat muerto", "dead server", "server muerto", "servidor muerto", "sv muerto", "revivan el server", "murio el chat"].some(word => content.includes(word)): 
      sentMessage = await message.reply({ content: '### <:Info:1345848332760907807> Por favor, no vengas a decir "dead chat" o variedades.\nSolo estás incomodando y acabando con cualquier tema de conversación, en lugar de quejarte como tonto, opta por crear un tema de conversación nuevo o continuar con uno anterior, verás que es mucho más efectivo y ayudas a crear la actividad que estás buscando.', components: [actionRow], allowedMentions: { repliedUser: false } });
      removeButtons(sentMessage);
      break;
      
      // Predeterminado
      default:
      break;
    }
  } catch (error) {
    console.error("Ha ocurrido un error al responder el mensaje:", error);
  }
}