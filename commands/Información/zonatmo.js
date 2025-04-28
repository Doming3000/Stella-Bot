import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } from "discord.js";
import axios from "axios";

export const data = new SlashCommandBuilder()
.setName('zonatmo')
.setDescription('Se conecta a ZonaTMO para obtener información de mangas.')
.addStringOption(option =>
  option.setName('url')
  .setDescription('URL del manga.')
  .setRequired(true)
)

// Función para verificar si la URL es válida (para este contexto)
function isValidURL(url) {
  try {
    const parsedURL = new URL(url);
    const regex = /^https:\/\/zonatmo\.com\/library\/[^\/]+\/\d+\/[^\/]+$/;
    return regex.test(parsedURL.href);
  } catch (error) {
    return false;
  }
}

// Función para contar capítulos inteligentemente (ignorar capitulos extras)
function countChapters(listaCapitulos) {
  const numerosUnicos = new Set();
  
  listaCapitulos.forEach(cap => {
    const match = cap.Title.match(/Cap[ií]tulo\s+(\d+)/i);
    if (match) {
      const numero = parseInt(match[1], 10);
      numerosUnicos.add(numero);
    }
  });
  
  return numerosUnicos.size;
}

export async function run(client, interaction) {
  const url = interaction.options.getString('url');
  
  // Verificar si el valor proporcionado es una URL válida.
  if (!isValidURL(url)) {
    await interaction.reply({ content: "<:Advertencia:1302055825053057084> Debes proporcionar una URL de ZonaTMO válida.\nEjemplo: `https://zonatmo.com/library/manga/23741/dr-stone`", flags: 64, allowedMentions: { repliedUser: false }});
    return;
  }
  
  try {
    // Indicar que se está procesando la solicitud
    await interaction.deferReply();
    
    // Realizar una solicitud HTTP GET a la API usando axios.
    const { data } = await axios.get(`https://tumangaonlineapi-production.up.railway.app/api/v1/manga/info`, { params: { mangaUrl: url }});
    const manga = data.data;
    
    // Comprobar si hay resultados que mostrar
    if (!manga) {
      return interaction.editReply({ content: "<:Advertencia:1302055825053057084> No se encontró información del manga.", allowedMentions: { repliedUser: false }});
    }
    
    // Limpiar nombre
    const cleanedTitle = manga.title.replace(/\s+/g, ' ').trim();
    
    // Limpiar géneros
    const genres = (manga.generos || []).map(genre => genre.trim()).join(', ');
    
    // Embed principal
    const embed = new EmbedBuilder()
    .setColor(0x7986cb)
    .setAuthor({
      name: `${client.user.username} - ${interaction.commandName}`,
      iconURL: client.user.displayAvatarURL()
    })
    .setTitle(cleanedTitle.length > 70 ? cleanedTitle.slice(0, 67) + "..." : cleanedTitle)
    .setDescription(manga.descripcion ? (manga.descripcion.length > 500 ? manga.descripcion.slice(0, 497) + "..." : manga.descripcion) : 'Sinopsis no disponible.')
    .setImage(manga.image || null)
    .addFields(
      { name: "📚 - Géneros", value: genres + "." || "Desconocido", inline: false },
      { name: "💻 - Estado", value: manga.estado || "Desconocido", inline: true },
      { name: "🌏 - Demografía", value: manga.demografia || "Desconocido", inline: true },
      { name: "🔖 - Capítulos", value: manga.capitulo ? countChapters(manga.capitulo).toString() : "0", inline: true },
    )
    .setFooter({ text: "Información obtenida de ZonaTMO" });
    
    // Contenedor de botones
    const actionRow = new ActionRowBuilder()
    .addComponents(
      // Botón de suscripción
      new ButtonBuilder()
      .setCustomId("subscribe")
      .setEmoji("🔔")
      .setLabel("Suscribirse")
      .setStyle("Primary"),
      
      // Botón para abrir en el navegador
      new ButtonBuilder()
      .setEmoji("🌐")
      .setLabel("Abrir en el navegador")
      .setURL(url)
      .setStyle("Link"),
    );
    
    // Enviar mensaje
    await interaction.editReply({ embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false }});
    
    // Evento del colector
    const filter = i => i.customId === 'subscribe';
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60 * 1000 });
    
    collector.on('collect', async (i) => {
      // Variable para almacenar los usuarios que han hecho clic en el botón
      const clickedUsers = new Set();
      
      // Comprobar si el usuario ya se suscribió
      if (clickedUsers.has(i.user.id)) {
        await i.reply({ content: '<:Advertencia:1302055825053057084> Ya te has suscrito. Revisa tus mensajes directos.', flags: 64 });
        return;
      }
      
      // Procesar la suscripción
      await i.reply({ content: '<:Done:1326292171099345006> ¡Hecho! Revisa tus mensajes directos. (Sin terminar)', flags: 64 });
      clickedUsers.add(i.user.id);
    });
    
    // Finalizar colector
    collector.on('end', async () => {
      try {
        // Obtener mensaje original
        const message = await interaction.fetchReply();
        
        // Desactivar los botones
        const disabledComponents = message.components.map(row => {
          const newRow = ActionRowBuilder.from(row);
          newRow.components = row.components.map(component => {
            const newButton = ButtonBuilder.from(component);
            
            // Mantener activos los botones de tipo enlace
            if (newButton.data.style !== 5) {
              newButton.setDisabled(true);
            }
            return newButton;
          });
          return newRow;
        });
        
        // Editar mensaje original con los botones desactivados
        await interaction.editReply({ components: disabledComponents });
      } catch (error) {
        // Si da error, puede deberse a que el mensaje se eliminó.
        return;
      }
    });
  } catch (error) {
    interaction.editReply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar este comando.", allowedMentions: { repliedUser: false }});
    console.log(error);
  }
}