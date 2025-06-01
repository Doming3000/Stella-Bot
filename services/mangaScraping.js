import { EmbedBuilder, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { query } from "../database.js";
import * as cheerio from "cheerio";
import cron from "node-cron";
import dotenv from 'dotenv';
import axios from "axios";

// Cargar variables de entorno
dotenv.config();

// Función para iniciar el scraping programado
export function startScraping(client) {
  // Programa: Minuto 1 de cada hora (HH:01)
  cron.schedule('1 * * * *', () => {
    console.log('⏰  - Ejecutando scraping programado.');
    checkNewChapter(client);
  });
}

// Función para comprobar si hay un nuevo capítulo
async function checkNewChapter(client) {
  try {
    // Consultar la base de datos
    const result = await query('SELECT * FROM mangasuscription');
    
    for (const row of result) {
      const { id, userID, mangaTitle, mangaUrl, lastChapter } = row;
      const user = await client.users.fetch(userID);
      
      try {
        // Simular un navegador real para evitar bloqueos
        const { data: html } = await axios.get(mangaUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }});
        
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
          continue;
        }
        
        // Comprobar si hay un nuevo capítulo
        if (newChapterNumber && newChapterNumber > parseFloat(lastChapter)) {
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
          continue;
        }
      } catch (error) {
        console.error(`Ha ocurrido un error al comprobar ${mangaTitle}:`, error.message);
      }
    }
  } catch (error) {
    console.error("No se pudo conectar a la base de datos:", error.message);
  }
}