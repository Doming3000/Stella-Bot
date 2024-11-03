export async function handleMessage(message) {
  // Ignorar mensajes de bots
  if (message.author.bot) return;
  
  const content = message.content.toLowerCase();
  
  // Reaccion con un emoji custom
  if (content.includes("porno")) {
    await message.react('<:SmugVanilla:1301622187350036581>');
  }
  
  // Otra reacción con un emoji preterminado
  // else if (content.includes("test")) {
  //   await message.react("😢");
  // }
}