import fs from 'fs';
import path from 'path';

export async function handleMessage(message, client) {
  // Registrar mensajes directos
  if (message.channel.type !== 1 || message.author.id === client.user.id) return;
  
  const logsDir = path.join(process.cwd(), 'logs');
  const fileName = `${message.author.id} - ${message.author.tag}.txt`;
  const filePath = path.join(logsDir, fileName);
  const content = `${message.createdAt} - "${message.content}"\n`;
  
  try {
    // Comprobar si el archivo existe en la carpeta, si no, crearlo
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '', 'utf8');
    }

    // Escribir el contenido en el archivo
    fs.appendFileSync(filePath, content, 'utf8');
    console.log(`📃  - Mensaje directo de ${message.author.tag} | ${message.author.id} recibido: ${message.content}`);
  }
  catch (error) {
    console.error(`❌  - No se pudo registrar el mensaje directo de ${message.author.tag} | ${message.author.id}: ${error.message}`); 
  }
}