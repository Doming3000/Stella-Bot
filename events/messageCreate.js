import fs from 'fs/promises';

export const name = 'messageCreate';

// Esta función ejecutará todos los manejadores de `messageEvents`
export async function execute(message) {
  const handlerFiles = await fs.readdir(new URL('./messageEvents', import.meta.url));
  
  for (const file of handlerFiles) {
    const { handleMessage } = await import(`./messageEvents/${file}`);
    if (typeof handleMessage === 'function') {
      await handleMessage(message);
    }
  }
}