import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } from "discord.js";
import { query } from "../../database.js";
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

// Función para obtener el último capítulo
function getLastChapterNumber(chaptersArray) {
  if (!Array.isArray(chaptersArray) || chaptersArray.length === 0) return null;
  // Obtener el capítulo más reciente
  const title = chaptersArray[0].Title;
  
  // Extraer el número
  const match = title.match(/Cap[ií]tulo\s+([\d.]+)/i);
  return match ? match[1] : null;
}

// Función para desactivar componentes
async function disableComponents(target) {
  try {
    let message;
    if (typeof target.fetchReply === 'function') {
      // Si es una interacción: editReply necesita fetchReply + editReply
      message = await target.fetchReply();
    } else {
      // Si es un mensaje
      message = target;
    }
    
    // Construir los nuevos ActionRows con los componentes deshabilitados
    const disabled = message.components.map(row => {
      const newRow = ActionRowBuilder.from(row);
      newRow.components = row.components.map(comp => {
        // Botones
        if (comp.type === 2) {
          const btn = ButtonBuilder.from(comp);
          // Mantener activos los botones de tipo enlace
          if (btn.data.style !== 5) btn.setDisabled(true);
          return btn;
        }
        // Select menus 
        if (comp.type === 3) {
          return StringSelectMenuBuilder.from(comp).setDisabled(true);
        }
        // Mantener otros componentes por si acaso
        return comp;
      });
      return newRow;
    });
    
    // Actualizar el mensaje
    if (message.edit) {
      // Mensaje normal o reply diferido
      await message.edit({ components: disabled });
    } else {
      // Fallback para Interactions viejas
      await target.editReply({ components: disabled });
    }
  } catch (error) {
    // Si da error, puede deberse a que el mensaje se eliminó. Ignorar para evitar problemas.
    return;
  }
}

// Función para mostrar información del manga
async function showInfoManga(client, interaction, manga, url) {
  // Formatear géneros
  const genres = (manga.genres || []).map(genre => genre.trim()).join(', ');
  
  // Embed de la información
  const embed = new EmbedBuilder()
  .setColor(0x7986cb)
  .setAuthor({
    name: `${client.user.username} - ${interaction.commandName}`,
    iconURL: client.user.displayAvatarURL()
  })
  .setTitle(manga.title.length > 70 ? manga.title.slice(0, 67) + "..." : manga.title + " - " + manga.type)
  .setDescription(manga.synopsis ? (manga.synopsis.length > 500 ? manga.synopsis.slice(0, 497) + "..." : manga.synopsis) : 'Sinopsis no disponible.')
  .setImage(manga.image || null)
  .addFields(
    { name: "📚 - Géneros", value: genres + "." || "Desconocido", inline: false },
    { name: "💻 - Estado", value: manga.status || "Desconocido", inline: true },
    { name: "🌏 - Demografía", value: manga.demography || "Desconocido", inline: true },
    { name: "🔖 - Capítulos", value: manga.chapters ? countChapters(manga.chapters).toString() : "0", inline: true },
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
    
    // Botón para leer el primer capítulo
    new ButtonBuilder()
    .setCustomId("readChapter")
    .setEmoji("📖")
    .setLabel("Leer el primer capitulo")
    .setStyle("Secondary"),
    
    // Botón para abrir en el navegador
    new ButtonBuilder()
    .setLabel("Abrir en el navegador")
    .setURL(url)
    .setStyle("Link"),
  );
  
  // Enviar mensaje
  await interaction.editReply({ embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false }});
  
  // Evento del colector
  const filter = i => (i.customId === 'subscribe' || i.customId === 'readChapter') && i.user.id === interaction.user.id;
  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 2 * 60 * 1000 });
  
  const clickedUsers = new Set(); // Usuarios que hicieron click en el botón
  const alreadySubscribedUsers = new Set(); // Usuarios que ya estaban suscritos
  
  collector.on('collect', async (i) => {
    if (i.customId === 'subscribe') {
      // Comprobar si el manga ya está finalizado
      if (manga.status === "Finalizado") {
        await i.reply({ content: "<:Advertencia:1302055825053057084> No puedes suscribirte a un manga ya finalizado.", flags: 64, allowedMentions: { repliedUser: false }});
        return;
      }
      
      // Comprobar si el usuario ya hizo click en el botón
      else if (clickedUsers.has(i.user.id)) {
        await i.reply({ content: "<:Advertencia:1302055825053057084> Ya te has suscrito. Revisa tus mensajes directos.", flags: 64, allowedMentions: { repliedUser: false }});
        return;
      }
      
      // Comprobar si el usuario ya estaba suscrito
      else if (alreadySubscribedUsers.has(i.user.id)) {
        await i.reply({ content: "<:Advertencia:1302055825053057084> Ya estás suscrito a este manga.", flags: 64, allowedMentions: { repliedUser: false }});
        return;
      }
      
      // Procesar la suscripción
      let existing = [];
      try {
        try {
          existing = await query("SELECT 1 FROM mangasuscription WHERE userID = ? AND manga = ? LIMIT 1", [i.user.id, url]);
        } catch (dbError) {
          await i.reply({ content: "<:Advertencia:1302055825053057084> No se pudo verificar tu suscripción. Inténtalo de nuevo más tarde.", flags: 64, allowedMentions: { repliedUser: false }});
          console.error("Database Error:", dbError);
          return;
        }
        
        if (existing.length > 0) {
          alreadySubscribedUsers.add(i.user.id);
          await i.reply({ content: "<:Advertencia:1302055825053057084> Ya estás suscrito a este manga.", flags: 64, allowedMentions: { repliedUser: false }});
          return;
        }
        
        // Embed de confirmación
        const embed = new EmbedBuilder()
        .setColor(0x779ecb)
        .setAuthor({
          name: `${client.user.username} - ${interaction.commandName}`,
          iconURL: client.user.displayAvatarURL()
        })
        .setTitle(`Confirmar la suscripción a ${manga.title}`)
        .setDescription("Recibirás notificaciones cada vez que se publique un nuevo capitulo.")
        .setThumbnail(manga.image)
        .setFooter({ text: "Las notificaciones no son puntuales." });
        
        // Contenedor de botones
        const actionRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
          .setCustomId("confirmSubscription")
          .setEmoji("<:Done:1326292171099345006>")
          .setLabel("Confirmar")
          .setStyle("Success")
        );
        
        // Enviar DM
        const dmMessage = await i.user.send({ embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false } });
        
        // Para evitar errores
        if (i.replied || i.deferred) return;
        
        // Confirmar la interacción y registrar al usuario como suscrito
        await i.reply({ content: "<:Done:1326292171099345006> **¡Hecho!** Revisa tus mensajes directos.", flags: 64, allowedMentions: { repliedUser: false }});
        clickedUsers.add(i.user.id);
        
        // Evento del colector
        const collector = dmMessage.createMessageComponentCollector({ filter: btnInt => btnInt.customId === 'confirmSubscription' && btnInt.user.id === i.user.id, time: 60 * 1000 });
        
        collector.on('collect', async (i) => {
          try {
            // Desactivar el botón
            collector.stop();
            
            // Registrar la suscripción en la base de datos
            await query("INSERT INTO mangasuscription (userID, manga, status, lastChapter) VALUES (?, ?, ?, ?)", [i.user.id, url, manga.status, getLastChapterNumber(manga.chapters)]);
            
            // Confirmar la interacción.
            await i.reply({ content: `<:Done:1326292171099345006> **¡Hecho!** Te has suscrito a ${manga.title}.`, allowedMentions: { repliedUser: false }});
            
          } catch (dbError) {
            await i.reply({ content: "<:Advertencia:1302055825053057084> No se pudo registrar la suscripción. Inténtalo de nuevo más tarde.", flags: 64, allowedMentions: { repliedUser: false }});
            console.log(dbError);
          }
        });
        
        // Finalizar colector
        collector.on('end', async () => {
          await disableComponents(dmMessage);
        });
      } catch (error) {
        await i.followUp({ content: '<:Advertencia:1302055825053057084> No se ha podido enviar DM. ¿Tienes los mensajes directos activados?', flags: 64, allowedMentions: { repliedUser: false }});
        console.log(error);
      }
    }
    
    else if (i.customId === 'readChapter') {
      try {
        // Clonar los componentes originales para desactivar el botón
        const oldComponents = i.message.components.map(row => {
          const newRow = new ActionRowBuilder();
          newRow.addComponents(
            row.components.map(button => {
              const newButton = ButtonBuilder.from(button);
              if (newButton.data.custom_id === 'readChapter') {
                newButton.setDisabled(true);
              }
              return newButton;
            })
          );
          return newRow;
        });
        
        // Editar el mensaje original con el botón desactivado
        await i.message.edit({ components: oldComponents });
        
        // Realizar una solicitud HTTP GET a la API usando axios.
        const { data } = await axios.get(`https://tumangaonlineapi-production.up.railway.app/api/capitulo`, { params: { url: url, cap: 1 }});
        
        // Comprobar si hay resultados
        if (!data || !data.data || data.data.length === 0) {
          return await i.reply({ content: "<:Advertencia:1302055825053057084> No se encontraron enlaces para el primer capítulo.", flags: 64, allowedMentions: { repliedUser: false }});
        }
        
        // Limitar a los primeros 5 resultados
        const scans = data.data.slice(0, 5);
        
        // Texto por si hay mas de 5 resultados
        const extraInfo = data.data.length > 5 ? "\n-# Solo se muestran los primeros 5 scans disponibles.": "";
        
        // Crear botones de tipo enlace
        const buttons = scans.map(scan =>
          new ButtonBuilder()
          .setLabel(scan.scan.length > 80 ? scan.scan.slice(0, 77) + '...' : scan.scan)
          .setStyle("Link")
          .setURL(scan.urlRead)
        );
        
        const actionRow = new ActionRowBuilder().addComponents(buttons);
        
        await i.reply({ content: `**Seleccione una opción**:${extraInfo}`, components: [actionRow], allowedMentions: { repliedUser: false }});
      } catch (error) {
        await i.reply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al obtener los enlaces del capítulo.", allowedMentions: { repliedUser: false }});
        console.error(error);
      }
    }
  });
  
  // Finalizar colector
  collector.on('end', async () => {
    await disableComponents(interaction);
  });
}

// Función run (comando principal)
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
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 2 * 60 * 1000, max: 1 })
      
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