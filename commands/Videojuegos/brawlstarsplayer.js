import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
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
    
    const response = await axios.get(apiUrl, { headers: { Authorization: `Bearer ${BRAWL_API_TOKEN}` }});
    const player = response.data;
    
    // Obtener el icono del jugador y colocarlo en una url de brawlify
    const iconUrl = `https://cdn.brawlify.com/profile-icons/regular/${player.icon.id}.png`;
    
    // Embed principal
    const embed = new EmbedBuilder()
    .setColor(0xffcd00)
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
      { name: ':medal: Victorias totales', value: `3vs3 ${player["3vs3Victories"]}\nSolo ${player.soloVictories}\nDuo ${player.duoVictories}`, inline: false },
      { name: ':shield: Club', value: `${player.club?.name || '*Sin club*'}`, inline: false }
    );
    
    // Enviar mensaje
    interaction.editReply({ embeds: [embed], allowedMentions: { repliedUser: false }});
  } catch (error) {
    if (error.response && error.response.status === 404) {
      interaction.editReply({ content: "<:Advertencia:1302055825053057084> No se ha podido encontrar al jugador.", allowedMentions: { repliedUser: false }});
    } else {
      interaction.editReply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar este comando.", allowedMentions: { repliedUser: false }});
    }
  }
}