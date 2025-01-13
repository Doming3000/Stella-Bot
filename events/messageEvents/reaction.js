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
    // Reaccionar con un emoji custom
    case content.includes("hello world!"):
    await message.react('<:SmugVanilla:1324462261498286130>');
    break;
    
    // Reaccionar con un emoji preterminado
    case content.includes("easter egg"):
    await message.react("🥚");
    break;
    
    // Predeterminado
    default:
    break;
  }
}