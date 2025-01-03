import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } from "discord.js";
import axios from "axios";

export const data = new SlashCommandBuilder()
.setName('mcskin')
.setDescription('Muestra la skin de un jugador de Minecraft premium.')
.addStringOption(option =>
  option.setName('nombre')
  .setDescription('Nick del jugador premium.')
  .setRequired(true)
);

// Función principal que se ejecuta cuando el comando es llamado.
export async function run(client, interaction) {
  const nombre = interaction.options.getString('nombre');
  const caracteres = nombre.length;
  
  // Validar si el nombre del jugador sobrepasa los 16 caracteres.
  if (caracteres > 16) {
    interaction.reply({ content: "<:Advertencia:1302055825053057084> El nombre de este jugador sobrepasa los 16 caracteres.", flags: 64 , allowedMentions: { repliedUser: false }});
    return;
  }
  
  const mojangPlayerApi = `https://api.mojang.com/users/profiles/minecraft/${nombre}`;
  
  try {
    // Indicar que estamos procesando la solicitud
    await interaction.deferReply({ flags: 0 });
    
    // Realizar una solicitud HTTP GET a la API usando axios.
    const response = await axios.get(mojangPlayerApi);
    
    const body = response.data;
    
    // Extraer el ID del jugador y generar las URLs necesarias.
    const playerId = body.id;
    const render = `https://mc-heads.net/body/${playerId}/128.png`;
    const skin = `https://crafatar.com/skins/${playerId}.png`;
    const avatar = `https://mc-heads.net/avatar/${playerId}.png`;
    
    // Embed principal con la skin del jugador.
    const embed = new EmbedBuilder()
    .setColor(0x94bf63)
    .setAuthor({
      name: `${client.user.username} - ${interaction.commandName}`,
      iconURL: client.user.displayAvatarURL()
    })
    .setTitle(`Skin del jugador: ${body.name}`)
    .setImage(render)
    .setThumbnail(avatar);
    
    // Botón para abrir la skin en el navegador.
    const actionRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
      .setEmoji("<:Imagen:1302064339829653535>")
      .setLabel("Abrir en el navegador")
      .setURL(`${skin}`)
      .setStyle("Link")
    );
    
    // Enviar mensaje
    interaction.editReply({ embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false }});
  } catch (error) {
    if (error.response && error.response.status === 404) {
      interaction.editReply({ content: "<:Advertencia:1302055825053057084> No se ha podido encontrar al jugador.", allowedMentions: { repliedUser: false }});
    } else {
      interaction.editReply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar el comando.", allowedMentions: { repliedUser: false }});
    }
  }
}