import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
.setName('say')
.setDescription('Envía un mensaje anónimo a través del bot')
.addStringOption(option => 
  option.setName('contenido')
  .setDescription('Contenido del mensaje.')
  .setRequired(true)
);

export function run(client, interaction) {
  const contenido = interaction.options.getString('contenido');
  const channel = interaction.channel;
  
  // Comprobar si el contenido incluye @everyone, @here o menciones de roles <@&roleID>
  const roleMentionPattern = /<@&\d+>/;
  
  if (contenido.includes('@everyone') || contenido.includes('@here') || roleMentionPattern.test(contenido)) {
    interaction.reply({ content: '<:Advertencia:1302055825053057084> ¿Estás tratando de hacer una mención masiva? Lo siento, no puedes hacer eso.', ephemeral: true });
  }
  
  else {
    // Responder al usuario y enviar mensaje al canal
    interaction.reply({ content: 'Mensaje enviado', ephemeral: true });
    channel.send({ content: `${contenido}` });
  }
}