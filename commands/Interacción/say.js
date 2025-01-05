import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
.setName('say')
.setDescription('Envía un mensaje anónimo a través del bot')
.addStringOption(option => 
  option.setName('contenido')
  .setDescription('Contenido del mensaje.')
  .setRequired(true)
);

// función auxiliar para enviar la confirmación de mensaje y eliminarla después de un tiempo
async function sendConfirmation(interaction, message = 'Mensaje enviado!') {
  const reply = await interaction.reply({ content: message, flags: 64 });
  
  // Eliminar la confirmación después de 3 segundos
  setTimeout(() => reply.delete(), 3000);
}

export async function run(client, interaction) {
  const contenido = interaction.options.getString('contenido');
  
  // Registrar en la consola al usuario que ejecutó el comando
  console.log(`📃  - ${interaction.user.tag} | ${interaction.user.id} usó /say: ${contenido}.`);
  
  // Comprobar si existe un canal de interacción; si no, se asume que es un mensaje directo
  if (!interaction.channel) {
    sendConfirmation(interaction);
    interaction.user.send({ content: contenido });
  } else {
    // Verificar si el contenido incluye menciones masivas
    const roleMentionPattern = /<@&\d+>/;
    
    if (contenido.includes('@everyone') || contenido.includes('@here') || roleMentionPattern.test(contenido)) {
      await interaction.reply({ content: '<:Advertencia:1302055825053057084> ¿Estás tratando de hacer una mención masiva? Lo siento, no puedes hacer eso.', flags: 64 });
    } else {
      sendConfirmation(interaction);
      interaction.channel.send({ content: contenido });
    }
  }
}