export async function handleMessage(message) {
  // Ignorar mensajes de bots
  if (message.author.bot) return;
  
  const content = message.content.toLowerCase();
  
  // Reacción con un emoji custom
  if (content.includes("Lorem ipsum dolor sit")) {
    await message.react('<:SmugVanilla:1324462261498286130>');
  }
  
  // Reacción con un emoji preterminado
  else if (content.includes("Lorem ipsum dolor sit 2")) {
    await message.react("🐔");
  }
}