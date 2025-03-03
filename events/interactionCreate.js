export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction, client) {
  let cmd = client.commands.find((c) => (c.data.name === interaction.commandName));
  
  if (cmd != null && interaction.isChatInputCommand()) {
    // Block bots
    if (interaction.user.bot) {
      return;
    }
    cmd.run(client, interaction);
  }
  
  // Manejador de botones mediante IDs
  else if (interaction.customId === "deleteMessage") {
    // Comprobar si el usuario tiene permisos para eliminar mensajes
    if (!interaction.member.permissions.has("ManageMessages")) {
      return interaction.reply({ content: "<:Advertencia:1302055825053057084> No tienes permisos para realizar esta acción.", flags: 64 , allowedMentions: { repliedUser: false }});
    }
    
    try {
      await interaction.message.delete();
      await interaction.channel.send({ content: "Entendido!"})
    } catch (error) {
      console.error("Ha ocurrido un error al eliminar el mensaje:", error);
    }
  }
}