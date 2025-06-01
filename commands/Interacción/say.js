import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
.setName('say')
.setDescription('Envía un mensaje anónimo a través del bot')
.addStringOption(option => 
  option.setName('contenido')
  .setDescription('Contenido del mensaje.')
  .setRequired(true)
);

// Función para confirmar la interacción
async function sendConfirmation(interaction) {
  const reply = await interaction.reply({ content: "<:Done:1326292171099345006> ¡Mensaje enviado!", flags: 64, allowedMentions: { repliedUser: false }});
  
  // Eliminar la confirmación después de 1.5 segundos
  setTimeout(() => reply.delete(), 1500);
}

export async function run(client, interaction) {
  const contenido = interaction.options.getString('contenido');
  
  // Registrar en la consola al usuario que ejecutó el comando
  console.log(`📃  - /say ejecutado por ${interaction.user.tag} | ${interaction.user.id}: ${contenido}`);
  
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