export async function handleMessage(message) {
  // Ignorar mensajes de bots
  if (message.author.bot) return;
  
  const content = message.content.toLowerCase();
  
  // Reacciona con emoji custom
  if (content.includes("test1")) {
    await message.react('<:SmugVanilla:1301622187350036581>');
  }
  
  // Reacciona con un emoji de carita triste
  else if (content.includes("test2")) {
    await message.react("😢");
  }
}