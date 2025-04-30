import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } from "discord.js";
import axios from "axios";

export const data = new SlashCommandBuilder()
.setName('zonatmo')
.setDescription('Muestra información de un manga de ZonaTMO.')
.addSubcommand(sub =>
  sub
  .setName('search-url')
  .setDescription('Muestra información de un manga de ZonaTMO por medio de la URL.')
  .addStringOption(opt =>
    opt
    .setName('url')
    .setDescription('URL del manga. Ejemplo: https://zonatmo.com/library/manga/23741/dr-stone')
    .setRequired(true)
  )
)
.addSubcommand(sub =>
  sub
  .setName('search-title')
  .setDescription('Busca un manga en ZonaTMO por medio del título.')
  .addStringOption(opt =>
    opt
    .setName('title')
    .setDescription('Título del manga. Ejemplo: Dr. Stone')
    .setRequired(true)
  )
);

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

// Función para mostrar información del manga
async function showInfoManga(client, interaction, manga, url) {
  // Formatear géneros
  const genres = (manga.generos || []).map(genre => genre.trim()).join(', ');
  
  // Embed de la información
  const embed = new EmbedBuilder()
  .setColor(0x7986cb)
  .setAuthor({
    name: `${client.user.username} - ${interaction.commandName}`,
    iconURL: client.user.displayAvatarURL()
  })
  .setTitle(manga.title.length > 70 ? manga.title.slice(0, 67) + "..." : manga.title + " - " + manga.tipo)
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
  
  // Variable para almacenar los usuarios que han hecho clic en el botón
  const clickedUsers = new Set();
  
  collector.on('collect', async (i) => {
    // Comprobar si el usuario ya se suscribió
    if (clickedUsers.has(i.user.id)) {
      await i.reply({ content: '<:Advertencia:1302055825053057084> Ya te has suscrito. Revisa tus mensajes directos.', flags: 64, allowedMentions: { repliedUser: false }});
      return;
    }
    
    // Procesar la suscripción
    try {
      // Enviar mensaje directo al usuario
      await i.user.send({ content: "Te has suscrito a: " + manga.title + " (sin terminar)" });
      
      // Confirmar la interacción y registrar al usuario como suscrito
      await i.reply({ content: "<:Done:1326292171099345006> Te has suscrito a: " + manga.title + " (sin terminar).", flags: 64, allowedMentions: { repliedUser: false }});
      clickedUsers.add(i.user.id);
    } catch (error) {
      await i.reply({ content: '<:Advertencia:1302055825053057084> No se ha podido enviar DM. ¿Tienes los mensajes directos activados?', flags: 64, allowedMentions: { repliedUser: false }});
      console.log(error);
    }
  });
  
  // Finalizar colector
  collector.on('end', async () => {
    await disableComponents(interaction);
  });
}

// Función para desactivar componentes
async function disableComponents(interaction) {
  try {
    const message = await interaction.fetchReply();
    
    const disabledComponents = message.components.map(row => {
      const newRow = ActionRowBuilder.from(row);
      newRow.components = row.components.map(component => {
        // Botones
        if (component.type === 2) {
          const newButton = ButtonBuilder.from(component);
          // Mantener activos los botones de tipo enlace
          if (newButton.data.style !== 5) {
            newButton.setDisabled(true);
          }
          return newButton;
        }
        
        // Select menus
        else if (component.type === 3) {
          return StringSelectMenuBuilder.from(component).setDisabled(true);
        }
        
        // Manetener otros componentes por si acaso.
        return component;
      });
      return newRow;
    });
    
    await interaction.editReply({ components: disabledComponents });
  } catch (error) {
    // Si da error, puede deberse a que el mensaje se eliminó. Ignorar para evitar problemas.
    return;
  }
}

// Función principal
export async function run(client, interaction) {
  const subcommand = interaction.options.getSubcommand();
  
  // Lógica para manejar la URL
  if (subcommand === 'search-url') {
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
      
      // Mostrar información del manga seleccionado
      await showInfoManga(client, interaction, manga, url);
      
    } catch (error) {
      interaction.editReply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar este comando.", allowedMentions: { repliedUser: false }});
      console.log(error);
    }
  }
  
  // Lógica para manejar la búsqueda por nombre
  if (subcommand === 'search-title') {
    const title = interaction.options.getString('title');
    
    try {
      // Indicar que se está procesando la solicitud
      await interaction.deferReply();
      
      // Realizar una solicitud HTTP GET a la API usando axios.
      const { data } = await axios.get(`https://tumangaonlineapi-production.up.railway.app/api/v1/manga/library`, { params: { title }});
      
      // Comprobar si hay resultados
      if (!data || !data.data?.length) {
        interaction.editReply({ content: "<:Advertencia:1302055825053057084> No se han encontrado resultados para esta búsqueda.", allowedMentions: { repliedUser: false }});
        return;
      }
      
      // Limitar solo a los 10 primeros resultados
      const results = data.data.slice(0, 10);
      
      // Embed de resultados
      const embed = new EmbedBuilder()
      .setColor(0x7986cb)
      .setAuthor({
        name: `${client.user.username} - ${interaction.commandName}`,
        iconURL: client.user.displayAvatarURL()
      })
      .setTitle(`Resultados de búsqueda para: "${title}"`)
      .setDescription(
        results.map((m, i) => {
          const shortTitle = m.title.length > 50 ? m.title.slice(0, 47) + "..." : m.title;
          return `**${i + 1}.** [${shortTitle}](${m.mangaUrl}) - ${m.type}`;
        }).join('\n')
      )
      
      if (data.data.length > 10) {
        embed.setFooter({ text: 'Solo se muestran los 10 primeros resultados del sitio.' });
      }
      
      // Menú de selección
      const selectOptions = results.map((manga) => ({
        label: manga.title.length > 25 ? manga.title.slice(0, 22) + '...' : manga.title,
        description: manga.type,
        value: manga.mangaUrl
      }));
      
      const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('selectManga')
      .setPlaceholder('Selecciona un manga de los resultados.')
      .addOptions(selectOptions);
      
      const actionRow = new ActionRowBuilder().addComponents(selectMenu);
      
      // Envíar mensaje
      await interaction.editReply({ embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false }});
      
      // Evento del colector
      const filter = i => i.customId === 'selectManga' && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60 * 1000, max: 1 });
      
      collector.on('collect', async i => {
        try {
          // Evitar que el usuario vea "interacción fallida"
          await i.deferUpdate();
          
          const selectedUrl = i.values[0];
          
          // Realizar una solicitud HTTP GET a la API usando axios.
          const { data } = await axios.get(`https://tumangaonlineapi-production.up.railway.app/api/v1/manga/info`, { params: { mangaUrl: selectedUrl }});
          const selectedManga = data.data;
          
          // Mostrar información del manga seleccionado
          await showInfoManga(client, interaction, selectedManga, selectedUrl);
        } catch (error) {
          await interaction.editReply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al obtener la información del manga.", components: [] });
          console.error(error);
        }
      });
      
      // Finalizar colector
      collector.on('end', async () => {
        await disableComponents(interaction);
      });
    }
    catch (error) {
      interaction.editReply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar este comando.", allowedMentions: { repliedUser: false }});
      console.log(error);
    }
  }
}