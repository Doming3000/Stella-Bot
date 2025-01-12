export async function handleMessage(message, client) {
  // Ignorar mensajes de bots
  if (message.author.bot) return;
  
  const content = message.content.toLowerCase();
  
  // Verificar si el bot fue mencionado de forma directa
  if (message.mentions.has(client.user) && !message.mentions.everyone && !message.mentions.roles.size) {
    await message.react("👋");
  }
  
  // Reacción con un emoji custom
  else if (content.includes("loremipsum")) {
    await message.react('<:SmugVanilla:1324462261498286130>');
  }
  
  // Reacción con un emoji preterminado
  else if (content.includes("dolorsit")) {
    await message.react("🐔");
  }
}