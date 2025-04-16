import fs from 'fs';
import path from 'path';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction, client) {
  let cmd = client.commands.find((c) => (c.data.name === interaction.commandName));
  
  if (cmd != null && interaction.isChatInputCommand()) {
    // Leer la lista negra
    const blacklistPath = path.resolve('blacklist.json');
    const rawData = fs.readFileSync(blacklistPath);
    const blacklist = JSON.parse(rawData);
    
    // Verificar si el usuario está en la lista negra
    const blacklistIds = blacklist.users.map(user => user.id);
    
    if (blacklistIds.includes(interaction.user.id)) {
      await interaction.reply({ content: "<:Advertencia:1302055825053057084> Estás bloqueado. No tienes permiso para usar la aplicación.", flags: 64 , allowedMentions: { repliedUser: false }});
      return;
    }
    
    cmd.run(client, interaction);
  }
}