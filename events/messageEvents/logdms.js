export async function handleMessage(message, client) {
  // Registrar mensajes directos
  if (message.channel.type !== 1 || message.author.id === client.user.id) return;
  
  console.log(`📃  - Mensaje directo de ${message.author.tag} | ${message.author.id} recibido: ${message.content}`);
}