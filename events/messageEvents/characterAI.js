import CharacterAI from 'node_characterai';
import { readFile } from 'fs/promises';

const characterAI = new CharacterAI();
const configPath = new URL('../../config.json', import.meta.url);
const { character_id, auth_token } = JSON.parse(await readFile(configPath, 'utf-8'));
const userChats = {};  // Diccionario de sesiones de chat

export async function handleMessage(message) {
  // IDs de canales permitidos para usar esta función
  const allowedChannels = ['1301249684236537938'];
  
  // Ignorar mensajes de bots o fuera de los canales permitidos
  if (message.author.bot || !allowedChannels.includes(message.channel.id)) return;
  
  // Verificar que el bot fue mencionado
  if (!message.mentions.has(message.client.user)) return;
  
  // Extraer mensaje sin la mención ni emojis personalizados
  const msgText = message.content
  .replace(/<@!?(\d+)>/, '')
  .replace(/<a?:\w+:\d+>/g, '')
  .trim();
  
  if (!msgText) return;
  
  message.channel.sendTyping();
  
  try {
    // Obtener la respuesta del bot
    const responseText = await getCharacterResponse(message.author.id, msgText);
    message.reply({ content: responseText, allowedMentions: { repliedUser: false }});
  } catch (error) {
    message.reply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al procesar el mensaje.", allowedMentions: { repliedUser: false }});
  }
}

// Función para conectar con Character AI
async function getCharacterResponse(userId, text) {
  try {
    // Autenticar si es necesario
    if (!characterAI.isAuthenticated()) {
      await characterAI.authenticateWithToken(auth_token);
    }
    
    // Crear o continuar la conversación del usuario específico
    if (!userChats[userId]) {
      userChats[userId] = await characterAI.createOrContinueChat(character_id);
    }
    
    // Enviar el mensaje y obtener la respuesta
    const response = await userChats[userId].sendAndAwaitResponse(text, true);
    if (response && response.text) {
      return response.text;
    } else {
      throw new Error("Respuesta no válida: no se encontró 'text'");
    }
  } catch (error) {
    console.error('Error al conectarse a Character AI:', error);
    throw error;
  }
}