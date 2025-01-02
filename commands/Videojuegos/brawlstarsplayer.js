import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { readFile } from "fs/promises";
import request from "request";

// Leer la configuración desde config.json
const configPath = new URL('../../config.json', import.meta.url);
const { brawl_stars_token } = JSON.parse(await readFile(configPath, 'utf-8'));

export const data = new SlashCommandBuilder()
.setName('brawlstars-player')
.setDescription('Muestra información de un jugador de Brawl Stars mediante su tag.')
.addStringOption(option =>
  option.setName('tag')
  .setDescription('Tag del jugador.')
  .setRequired(true)
);

export async function run(client, interaction) {
  // Diferir la respuesta para evitar el error de múltiples respuestas
  await interaction.deferReply();
  
  // Convertir a mayúsculas
  let tag = interaction.options.getString('tag').toUpperCase();
  
  // Añadir el # al inicio si no es proporcionado por el usuario
  if (!tag.startsWith("#")) {
    tag = `#${tag}`;
  }
  
  // Codificar tag para URL
  const api_url = `https://api.brawlstars.com/v1/players/${encodeURIComponent(tag)}`;
  
  // Opciones de la solicitud HTTP con el encabezado de autorización
  const options = { url: api_url, headers: { "Authorization": `Bearer ${brawl_stars_token}` } };
  
  request(options, async function (err, resp, body) {
    if (err) {
      await interaction.followUp({ content: "Ocurrió un error al consultar la API.", ephemeral: true });
      return;
    }
    
    try {
      body = JSON.parse(body);
      
      // Verificar si el jugador existe en la API
      if (!body || !body.name) {
        await interaction.followUp({ content: "No he podido encontrar al jugador.", ephemeral: true });
        return;
      }
      
      // Obtener el icono del jugador y colocarlo en una url de brawlify
      const iconId = body.icon.id;
      const playerIconUrl = `https://cdn.brawlify.com/profile-icons/regular/${iconId}.png`;
      
      // Embed principal
      let embed = new EmbedBuilder()
      .setColor(0xffcd00)
      .setAuthor({
        name: `${client.user.username} - ${interaction.commandName}`,
        iconURL: client.user.displayAvatarURL()
      })
      .setTitle(`Estadísticas del jugador: ${body.name}`)
      .addFields(
        { name: ':hash: Tag', value: `${body.tag}`, inline: true },
        { name: ':trophy: Trofeos totales', value: `${body.trophies}`, inline: true },
        { name: ':trophy: Récord de trofeos', value: `${body.highestTrophies}`, inline: true },
        { name: ':first_place: Victorias en solitario', value: `${body.soloVictories}`, inline: true },
        { name: ':second_place: Victorias a dúo', value: `${body.duoVictories}`, inline: true },
        { name: ':third_place: Victorias 3vs3', value: `${body["3vs3Victories"]}`, inline: true },
        { name: ':shield: Club', value: `${body.club && body.club.name ? body.club.name : "*Sin club*"}`, inline: true },
      )
      .setThumbnail(playerIconUrl);
      
      // Botones
      const actionRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
        .setCustomId('battle-log')
        .setEmoji('👍')
        .setLabel('Opción 1')
        .setStyle('Danger'),
        new ButtonBuilder()
        .setCustomId('moredata')
        .setEmoji('👎')
        .setLabel('Opción 2')
        .setStyle('Secondary'),
      );
      
      // Enviar el primer mensaje con el embed y el botón
      const sentMessage = await interaction.followUp({ embeds: [embed], components: [actionRow] });
      
      // Crear un collector para manejar las interacciones de los botones
      const collector = sentMessage.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 2 * 60 * 1000
      });
      
      // Manejar la interacción del botón
      collector.on("collect", async i => {
        if (i.customId === "battle-log") {
          // Embed del registro de batalla
          const battleLogEmbed = new EmbedBuilder()
          .setColor(0xffcd00)
          .setAuthor({
            name: `${client.user.username}`,
            iconURL: client.user.displayAvatarURL()
          })
          .setTitle(`Próximamente ${body.name}`);
          
          await i.reply({ embeds: [battleLogEmbed] });
        } else if (i.customId === "moredata") {
          // Embed de estadisticas adicionales
          const moredataEmbed = new EmbedBuilder()
          .setColor(0xffcd00)
          .setAuthor({
            name: `${client.user.username}`,
            iconURL: client.user.displayAvatarURL()
          })
          .setTitle(`Próximamente ${body.name}`);
          
          await i.reply({ embeds: [moredataEmbed] });
        }
      });
      
      // Al finalizar el tiempo del colector, desactivar el botón y agregar mensaje en el footer
      collector.on("end", () => {
        // Actualizar el embed y desactivar el botón
        embed.setFooter({ text: "Con el fin de ahorrar recursos, los botones han caducado." });
        actionRow.components.forEach(button => button.setDisabled(true));
        
        // Editar el mensaje con los botones desactivados y el footer actualizado
        sentMessage.edit({ embeds: [embed], components: [actionRow] }).catch(console.error);
      });
      
    } catch (err) {
      await interaction.followUp({ content: "Ha ocurrido un error al ejecutar el comando.", ephemeral: true });
    }
  });
}