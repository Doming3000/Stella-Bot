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
      const { id, manga, userID, lastChapter } = row;
      const user = await client.users.fetch(userID);
      
      try {
        // Simular un navegador real para evitar bloqueos
        const { data: html } = await axios.get(manga, { headers: { 'User-Agent': 'Mozilla/5.0' }});
        
        // Analizar el HTML con cheerio, obtener el selector de capítulos, el status del manga, el título y la portada
        const $ = cheerio.load(html);
        const newChapter = $('#chapters li.upload-link:first-of-type h4 a').first().text().trim();
        const mangaStatus = $('div.col-span-6.lg\\:col-span-2').filter((i, el) => $(el).text().includes('Estado')).find('span.block.break-words.font-bold').text().trim();
        const mangaTitle = $('h1.element-title.my-2').clone().children().remove().end().text().trim();
        const mangaThumbnail = $('div.tab-content img').attr('src');
        
        if (!newChapter) {
          console.warn("No se pudo encontrar el selector en la página.");
          return;
        }
        
        // Extraer solo el número del capítulo
        const match = newChapter.match(/Cap[ií]tulo\s+([\d.]+)/i);
        const numero = match ? parseFloat(match[1]) : null;
        
        // Comprobar el estado del manga antes de actualizarlo
        if (mangaStatus === 'Finalizado') {
          // Remover el manga de la base de datos
          await query('DELETE FROM mangasuscription WHERE manga = ?', [manga]);
          
          // Enviar un mensaje directo al usuario
          await user.send({ content: `<:Info:1345848332760907807> Un [manga](${manga}) al que estabas suscrito ha sido marcado como finalizado.`, allowedMentions: { repliedUser: false }});  
          continue;
        }
        
        // Comprobar si hay un nuevo capítulo
        if (numero && numero > parseFloat(lastChapter)) {
          // Embed de capítulo nuevo
          const embed = new EmbedBuilder()
          .setColor(0x2957ba)
          .setAuthor({ name: `${client.user.username}`, iconURL: client.user.displayAvatarURL()})
          .setTitle(mangaTitle)
          .setThumbnail(mangaThumbnail)
          .addFields(
            { name: "📙 - Nuevo capítulo", value: `➜ ${newChapter}`, inline: true },
          )
          
          // Botón para abrir en el navegador
          const actionRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
            .setLabel("Ir a ZonaTMO")
            .setURL(manga)
            .setStyle("Link"),
          );
          
          // Enviar un mensaje directo al usuario
          await user.send({ content: `<:Info:1345848332760907807> ¡Hay un nuevo capítulo disponible para **${mangaTitle}**!`, embeds: [embed], components: [actionRow], allowedMentions: { repliedUser: false }});  
          
          // Actualizar el último capítulo en la base de datos
          await query('UPDATE mangasuscription SET lastChapter = ? WHERE id = ?', [numero.toFixed(2), id]);
          return;
        }
      } catch (error) {
        console.error(`Ha ocurrido un error al comprobar ${manga}:`, error.message);
      }
    }
  } catch (error) {
    console.error("Ha ocurrido un error al ejecutar el scraping:", error.message);
  }
}