import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } from "discord.js";
import dotenv from 'dotenv';
import axios from "axios";

// Cargar variables de entorno
dotenv.config();

const BRAWL_API_TOKEN = process.env.BRAWL_API_TOKEN;

export const data = new SlashCommandBuilder()
.setName('brawlstars-player')
.setDescription('Muestra información de un jugador de Brawl Stars mediante su tag.')
.addStringOption(option =>
  option.setName('tag')
  .setDescription('Tag del jugador.')
  .setRequired(true)
);

export async function run(client, interaction) {
  // Convertir a mayúsculas
  let tag = interaction.options.getString('tag').toUpperCase();
  
  // Añadir el # al inicio si no es proporcionado por el usuario
  if (!tag.startsWith("#")) {
    tag = `#${tag}`;
  }
  
  // Codificar tag para URL
  const apiUrl = `https://api.brawlstars.com/v1/players/${encodeURIComponent(tag)}`;
  
  try {
    // Indicar que se está procesando la solicitud
    await interaction.deferReply();
    
    // Realizar una solicitud HTTP GET a la API usando axios.
    const playerInfo = await axios.get(apiUrl, { headers: { Authorization: `Bearer ${BRAWL_API_TOKEN}` }});
    const player = playerInfo.data;
    
    // Obtener el icono del jugador y colocarlo en una url de brawlify
    const iconUrl = `https://cdn.brawlify.com/profile-icons/regular/${player.icon.id}.png`;
    
    // Obtener el color del jugador y convertirlo para Discord
    const playerColor = player.nameColor & 0xFFFFFF;
    
    // Obtener la cantidad de brawlers del jugador
    const brawlersOwned = player.brawlers.length;
    
    // Obtener la cantidad total de brawlers 
    const brawlersData = await axios.get('https://api.brawlstars.com/v1/brawlers', { headers: { Authorization: `Bearer ${BRAWL_API_TOKEN}` }});
    
    const totalBrawlers = brawlersData.data.items.length;
    
    // Embed principal
    const embed = new EmbedBuilder()
    .setColor(playerColor)
    .setAuthor({
      name: `${client.user.username} - brawlstars-player`,
      iconURL: client.user.displayAvatarURL()
    })
    .setTitle(`Estadísticas de ${player.name}`)
    .setThumbnail(iconUrl)
    .addFields(
      { name: ':hash: Tag', value: `${player.tag}`, inline: true },
      { name: ':star: Nivel de XP', value: `${player.expLevel} (${player.expPoints} puntos)`, inline: true },
      { name: ':trophy: Trofeos', value: player.trophies === player.highestTrophies ? `🔥 ${player.trophies}` : `${player.trophies} (Récord: ${player.highestTrophies})`, inline: true },
      { name: ':medal: Victorias totales', value: `**3vs3**: ${player["3vs3Victories"]}\n**Solo**: ${player.soloVictories}\n**Duo**: ${player.duoVictories}`, inline: true },
      { name: ':busts_in_silhouette: Brawlers', value: `${brawlersOwned} / ${totalBrawlers}`, inline: true },
      { name: ':shield: Club', value: `${player.club?.name || '*Sin club*'}`, inline: false }
    )
    
    // Botones
    const actionRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
      .setCustomId('battleLog')
      .setEmoji('🗒️')
      .setLabel('Registro de batalla')
      .setStyle('Secondary'),
    );
    
    // Enviar mensaje
    await interaction.editReply({ embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false }});
    
    // Evento del colector
    const filter = i => {
      if (i.customId !== customId) return false;
      
      // Asegurarse de que solo el autor de la interacción pueda responder
      if (i.user.id !== interaction.user.id) {
        i.reply({ content: `<:Advertencia:1302055825053057084> <@${i.user.id}> No puedes interferir con las solicitudes de otros usuarios.`, flags: 64, allowedMentions: { repliedUser: false }}).catch(() => {});
        return false;
      }
      
      return true;
    };
    
    const collector = replyMessage.createMessageComponentCollector({ filter, time: 2 * 60 * 1000 });
    let wasHandled = false; // Variable para controlar si ya se manejó la interacción
    
    collector.on('collect', async i => {
      try {
        // Obtener el registro de batallas
        const battleLogRes = await axios.get(`https://api.brawlstars.com/v1/players/${encodeURIComponent(tag)}/battlelog`, { headers: { Authorization: `Bearer ${BRAWL_API_TOKEN}` }});
        
        // Limitar a las últimas 5
        const battles = battleLogRes.data.items.slice(0, 5);
        
        let logDescription = battles.map(b => {
          const mode = b.battle.mode;
          const result = b.battle.result || 'desconocido';
          const trophyChange = b.battle.trophyChange ? `(+${b.battle.trophyChange})` : '';
          const map = b.event.map || 'Mapa desconocido';
          const date = new Date(b.battleTime).toLocaleString('es-ES');
          
          return `**${mode.toUpperCase()}** - ${result} ${trophyChange} \n*Mapa:* ${map} \n🕒 ${date}`;
        }).join('\n\n');
        
        // Embed del registro
        const battlesEmbed = new EmbedBuilder()
        .setColor(playerColor)
        .setAuthor({
          name: `${client.user.username} - brawlstars-player`,
          iconURL: client.user.displayAvatarURL()
        })
        .setTitle(`Registro de batalla de ${player.name}`)
        .setDescription(logDescription)
        .setFooter({ text: "Solo se muestran las 5 batallas más recientes" });
        
        // Enviar respuesta
        await i.reply({ embeds: [battlesEmbed] });
        wasHandled = true;
        collector.stop();
      } catch (error) {
        await i.reply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al obtener el registro.", allowedMentions: { repliedUser: false }});
        console.error(error);
        collector.stop();
      }
    });
    
    // Finalizar colector
    collector.on('end', async () => {
      if (wasHandled) return;
      
      try {
        // Obtener mensaje original
        const message = await interaction.fetchReply();
        
        // Desactivar todos los botones
        const disabledComponents = message.components.map(row => {
          const newRow = ActionRowBuilder.from(row);
          newRow.components = row.components.map(component => 
            ButtonBuilder.from(component).setDisabled(true)
          );
          return newRow;
        });
        
        // Editar mensaje original con los botones desactivados
        await interaction.editReply({ components: disabledComponents });
      } catch (error) {
        // Si da error, puede deberse a que el mensaje se eliminó. Ignorar para evitar problemas.
        return;
      }
    });
  } catch (error) {
    console.error(error);
    if (error.playerInfo && error.playerInfo.status === 404) {
      interaction.editReply({ content: "<:Advertencia:1302055825053057084> No se ha podido encontrar al jugador.", allowedMentions: { repliedUser: false }});
    } else {
      interaction.editReply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar este comando.", allowedMentions: { repliedUser: false }});
    }
  }
}