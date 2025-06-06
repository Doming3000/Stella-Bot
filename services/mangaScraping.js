import { EmbedBuilder, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { query } from "../database.js";
import * as cheerio from "cheerio";
import cron from "node-cron";
import pLimit from "p-limit";
import dotenv from 'dotenv';
import axios from "axios";

// Cargar variables de entorno
dotenv.config();

// Límite de peticiones simultaneas para ahorrar recursos
const limit = pLimit(1);

// Función para iniciar el scraping programado
export function startScraping(client) {
  // Programa: Minuto 1 de cada hora (HH:01)
  cron.schedule('1 * * * *', () => {
    const horaActual = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    console.log(`⏰  - Ejecutando web scraping programado de las ${horaActual}.`);
    htmlCache(client);
  });
}

async function htmlCache(client) {
  try {
    // Consultar la base de datos
    const result = await query('SELECT * FROM mangasuscription');
    
    const htmlCache = new Map(); // Cachear HTMLs por URL
    
    const tasks = result.map(row => limit(() => checkNewChapter(row, client, htmlCache)));
    await Promise.all(tasks);
    
  } catch (error) {
    console.error("No se pudo consultar la base de datos para el web scraping: ", error.message);
  }
}

// Función para comprobar si hay un nuevo capítulo
async function checkNewChapter(row, client, htmlCache) {
  const { id, userID, mangaTitle, mangaUrl, lastChapter } = row;
  
  try {
    // Obtener al usuario (desde el caché si existe)
    const user = client.users.cache.get(userID) ?? await client.users.fetch(userID);
    
    // Usar caché para evitar realizar peticiones duplicadas
    let html;
    
    if (htmlCache.has(mangaUrl)) {
      html = htmlCache.get(mangaUrl);
    } else {
      // Simular un navegador real para evitar bloqueos
      const { data } = await axios.get(mangaUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }});
      html = data;
      htmlCache.set(mangaUrl, data);
    }
    
    // Analizar el HTML con cheerio, obtener el selector de capítulos, el status del manga y la miniatura
    const $ = cheerio.load(html);
    const newChapter = $('#chapters li.upload-link:first-of-type h4 a').first().text().trim();
    const mangaStatus = $('h5.element-subtitle').filter((i, el) => $(el).text().trim() === 'Estado').next('span.book-status').text().trim();  
    const mangaImage = $('img.book-thumbnail').attr('src')?.trim();  
    
    // Extraer solo el número del capítulo
    const match = newChapter.match(/Cap[ií]tulo\s+([\d.]+)/i);
    const newChapterNumber = match ? parseFloat(match[1]) : null;
    
    // Comprobar el estado del manga para decidir si debe ser eliminado
    if (mangaStatus === 'Finalizado') {
      // Remover el manga de la base de datos
      await query('DELETE FROM mangasuscription WHERE mangaUrl = ?', [mangaUrl]);
      
      // Enviar un mensaje directo al usuario
      await user.send({ content: `<:Info:1345848332760907807> El manga al que estabas suscrito: **${mangaTitle}**, ha sido marcado como finalizado.`, allowedMentions: { repliedUser: false }});
      return;
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
        .setLabel("Ir a ZonaTMO")
        .setURL(mangaUrl)
        .setStyle("Link"),
      );
      
      // Enviar un mensaje directo al usuario
      await user.send({ content: `<:Info:1345848332760907807> ¡Hay un nuevo capítulo disponible para **${mangaTitle}**!`, embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false }});  
      
      // Actualizar el último capítulo en la base de datos
      await query('UPDATE mangasuscription SET lastChapter = ? WHERE id = ?', [newChapterNumber.toFixed(2), id]);
      
      console.log(`📃  - Capítulo para ${mangaTitle} encontrado: ${newChapter}.`);
    }
  } catch (error) {
    console.error(`Ha ocurrido un error al comprobar ${mangaTitle}: `, error.message);
  }
}