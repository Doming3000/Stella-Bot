import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { query } from "../database.js";
import cron from "node-cron";
import dotenv from 'dotenv';
import axios from "axios";

// Cargar variables de entorno
dotenv.config();

// Función para iniciar el scraping programado
export function startScraping(client) {
  // Programa: Minuto 1 de cada hora (HH:01)
  cron.schedule('1 * * * *', () => {
    const horaActual = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    console.log(`⏰  - Ejecutando web scraping programado de las ${horaActual}.`);
    webScraping(client);
  });
}

// Función para realizar el web scraping
async function webScraping(client) {
  try {
    const startTime = Date.now();
    
    // Consultar la base de datos
    const result = await query('SELECT * FROM mangasuscription');
    if (result.length === 0) return;
    
    // Caché para evitar realizar peticiones duplicadas
    const UrlCache = new Map();
    
    // Comprobar si hay un nuevo capítulo        
    let processed = 0;
    
    for (const row of result) {
      const status = await checkNewChapter(row, client, UrlCache);
      
      if (status === 'stop') {
        break;
      }
      processed++;
    }
    
    console.log(`↪️  - Web scraping terminado. Se procesaron ${processed} mangas. La ejecución tardó ${(Date.now() - startTime) / 1000} segundos en completarse.`);
  } catch (error) {
    console.error("No se pudo consultar la base de datos para el web scraping: ", error.message);
  }
}

// Función para comprobar si hay un nuevo capítulo
async function checkNewChapter(row, client, UrlCache) {
  const { id, userID, mangaTitle, mangaUrl, lastChapter } = row;
  
  try {
    // Obtener al usuario (desde el caché si existe)
    const user = client.users.cache.get(userID) ?? await client.users.fetch(userID);
    
    // Usar caché para evitar realizar peticiones duplicadas
    let html;
    
    if (UrlCache.has(mangaUrl)) {
      html = UrlCache.get(mangaUrl);
    } else {
      try {
        // Simular un navegador real
        const { data } = await axios.get(mangaUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }});
        UrlCache.set(mangaUrl, data);
        html = data;
        
        // Esperar 2 segundos entre las consultas
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        // Manejar caso de sitio en mantenimiento
        if (error.response?.status === 503) {
          console.warn(`⚠️  - El sitio se encuentra actualmente en mantenimiento, no es posible continuar con el web scraping (503).`);
          return 'stop';
        }
        
        // Manejar exceso de peticiones
        if (error.response?.status === 429) {
          console.warn(`⚠️  - Web scraping interrumpido por exceso de peticiones (429).`);
          return 'stop';
        } else {
          throw error;
        }
      }
    }
    
    // Miniatura del manga
    const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    const mangaImage = imageMatch ? imageMatch[1].trim() : null;
    
    // Estado del manga
    const statusMatch = html.match(/<h5\s+class="element-subtitle">\s*Estado\s*<\/h5>\s*<span\s+class="book-status[^"]*">\s*([^<]+?)\s*<\/span>/i);
    const mangaStatus = statusMatch ? statusMatch[1].trim() : null;
    
    // Último capítulo disponible
    const chapterMatch = html.match(/Cap[ií]tulo\s+[\d.]+(?:\s+[^\n<]+)*/i);
    let newChapter = null;
    let newChapterNumber = null;
    
    // Extraer el nombre del capítulo y el número
    if (chapterMatch) {
      newChapter = chapterMatch[0].trim();
      const numMatch = newChapter.match(/Cap[ií]tulo\s+([\d.]+)/i);
      newChapterNumber = numMatch ? parseFloat(numMatch[1]) : null;
    }
    
    // Comprobar el estado del manga para decidir si debe ser eliminado
    if (mangaStatus === 'Finalizado') {
      // Remover el manga de la base de datos
      await query('DELETE FROM mangasuscription WHERE mangaUrl = ?', [mangaUrl]);
      
      // Enviar un mensaje directo al usuario
      try {
        const embed = new EmbedBuilder()
        .setColor(0x2957ba)
        .setAuthor({ name: `${client.user.username}`, iconURL: client.user.displayAvatarURL()})
        .setTitle(mangaTitle.length > 256 ? mangaTitle.slice(0, 253) + "..." : mangaTitle)
        .setImage(mangaImage)
        .setFields(
          { name: "📕 - Manga finalizado", value: `➜ Este manga ha finalizado su serialización en ZonaTMO.`, inline: true },
        )
        .setFooter({ text: "No necesitas cancelar tu suscripción." });
        
        await user.send({ content: `<:Info:1345848332760907807> El manga: **${mangaTitle}** ha finalizado.`, embeds: [embed], allowedMentions: { repliedUser: false }});
        return;
      } catch (error) {
        console.log(`⚠️  - No se pudo enviar el mensaje directo a ${user.username} | ${user.tag}.`);
        return;
      }
    }
    
    // Comprobar si hay un nuevo capítulo
    else if (newChapterNumber && newChapterNumber > parseFloat(lastChapter)) {
      // Embed de capítulo nuevo
      const embed = new EmbedBuilder()
      .setColor(0x2957ba)
      .setAuthor({ name: `${client.user.username}`, iconURL: client.user.displayAvatarURL()})
      .setTitle(mangaTitle.length > 256 ? mangaTitle.slice(0, 253) + "..." : mangaTitle)
      .setImage(mangaImage)
      .addFields(
        { name: "📙 - Nuevo capítulo", value: `➜ ${newChapter}`, inline: true },
      )
      
      // Botón para abrir en el navegador
      const actionRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
        .setEmoji('<:ZonaTMO:1391176305147383858>')
        .setLabel("Ver en ZonaTMO")
        .setURL(mangaUrl)
        .setStyle(ButtonStyle.Link),
      );
      
      // Actualizar el último capítulo en la base de datos
      await query('UPDATE mangasuscription SET lastChapter = ? WHERE id = ?', [newChapterNumber.toFixed(2), id]);
      
      // Enviar un mensaje directo al usuario
      try {
        await user.send({ content: `<:Info:1345848332760907807> ¡Hay un nuevo capítulo disponible para **${mangaTitle}**!`, embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false }});  
      } catch (error) {
        console.log(`⚠️  - No se pudo enviar el mensaje directo a ${user.username} | ${user.tag}.`);
        return;
      }
    }
  } catch (error) {
    console.error(`Ha ocurrido un error al comprobar ${mangaTitle}: `, error.message);
  }
}