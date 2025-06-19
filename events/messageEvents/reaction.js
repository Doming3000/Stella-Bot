export async function handleMessage(message, client) {
  // Ignorar mensajes de bots
  if (message.author.bot) return;
  
  const content = message.content.toLowerCase();
  
  // Comprobar si el bot fue mencionado de forma directa
  if (message.mentions.has(client.user) && !message.mentions.everyone && !message.system) {
    // Comprobar si la mención está en el texto del mensaje y no en otras estructuras
    const mentionRegex = new RegExp(`^<@!?${client.user.id}>`);
    
    if (mentionRegex.test(message.content)) {
      await message.react("👋");
    }
  }
  
  // Comprobar contenido de mensajes
  switch (true) {
    // Rawr
    case content.includes("rawr"):
    await message.react('<a:RawrAttack:1329113910376271943>');
    break;
    
    // Chicken jockey
    case content.includes("chicken jockey"):
    await message.react("🔥");
    break;
    
    // Tracking device
    case content.includes("tracking device"):
    await message.react("🔥");
    break;
    
    // Easter egg
    case content.includes("easter egg"):
    await message.react("🥚");
    break;
    
    // Predeterminado
    default:
    break;
  }
}