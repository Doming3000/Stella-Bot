import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
.setName('dm-test')
.setDescription('Comprueba la disponibilidad para recibir mensajes directos de la aplicación.')
.addStringOption(option =>
  option.setName('contenido')
  .setDescription('Opcional. Contenido del mensaje.')
  .setRequired(false)
);

export async function run(client, interaction) {
  const contenido = interaction.options.getString('contenido');
  
  try {    
    // Enviar mensaje directo al usuario
    if(!contenido) {
      const gifs = ["https://tenor.com/9E01.gif", "https://tenor.com/bisuu.gif", "https://tenor.com/birIr.gif", "https://tenor.com/bFxGn.gif", "https://tenor.com/bYbMp.gif"];
      await interaction.user.send({ content: gifs[Math.floor(Math.random() * gifs.length)], allowedMentions: { repliedUser: false }});
    } else {
      await interaction.user.send({ content: contenido, allowedMentions: { repliedUser: false }});
    }
    
    // Confirmar la interacción
    const reply = await interaction.reply({ content: "<:Done:1326292171099345006> ¡Mensaje enviado!", flags: 64, allowedMentions: { repliedUser: false }});
    
    // Eliminar la confirmación después de 1.5 segundos
    setTimeout(() => reply.delete(), 1500);
  } catch {
    interaction.reply({ content: "<:Advertencia:1302055825053057084> No se pudo enviar el mensaje. Asegúrate de tener los mensajes directos habilitados.", allowedMentions: { repliedUser: false }});
  }
}