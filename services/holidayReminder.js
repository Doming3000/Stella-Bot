import { EmbedBuilder } from "discord.js";
import cron from "node-cron";
import axios from "axios";

// Función para iniciar
export function startReminder(client) {  
  // Programa: Día 1 de cada mes a las 10 de la mañana
  cron.schedule('0 10 1 * *', () => {
    // Obtener fechas
    const date = new Date();
    const month = date.toLocaleDateString('es-ES', { month: 'long' }).replace(/^\w/, c => c.toUpperCase());
    const year = date.getFullYear();
    
    console.log(`⏰  - Consultando por los feriados de ${month} de ${year}`);
    getHolidays(client, month, year);
  })
}

function formatDate(apiDate) {
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  const [month, day] = fechaISO.split("-");
  
  return `${parseInt(day)} de ${months[parseInt(month) - 1]}`;
}

async function getHolidays(client, month, year) {
  try {
    // Consultar la API
    const targetUser = await client.users.fetch('811071747189112852');
    const country = 'CL';
    
    const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`);
    const holidays = response.data;
    
    // Filtrar por los feriados del mes
    const feriadosMes = holidays.filter(h => h.month == month);
    const sinFeriados = feriadosMes.length === 0
    
    // Formatear la fecha
    const formattedDate = formatDate(feriadosMes[0].date);
    
    // Crear embed
    const embed = new EmbedBuilder()
    .setColor(0x2a5993)
    .setAuthor({ name: `${client.user.username}`, iconURL: client.user.displayAvatarURL()})
    .setTitle(`Feriados de ${month} ${year}`)
    .addFields(sinFeriados ? { name: '🪧 - Sin feriados', value: 'No hay ningún feriado este mes.', inline: false } : feriadosMes.map(h => { return { name: `🪧 - ${h.name}`, value: formattedDate, inline: false }}))
    .setFooter({ text: 'Fuente: Nager.Date API.' });
    
    // Enviar un mensaje directo al usuario
    try {
      await targetUser.send({ embeds: [embed], allowedMentions: { repliedUser: false }}); 
    } catch (error) {
      return console.log(`⚠️  - No se pudo enviar el mensaje directo a ${user.username} | ${user.tag}.`);
    }
  } catch (error) {
    console.log('No se han podido consultar los feriados.', error);
  }
}