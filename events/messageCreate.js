import fs from 'fs/promises';

export const name = 'messageCreate';

// Función para manejar los messageEvents
export async function execute(message, interaction, client) {
  const handlerFiles = await fs.readdir(new URL('./messageEvents', import.meta.url));
  
  for (const file of handlerFiles) {
    const { handleMessage } = await import(`./messageEvents/${file}`);
    if (typeof handleMessage === 'function') {
      await handleMessage(message, interaction, client);
    }
  }
}