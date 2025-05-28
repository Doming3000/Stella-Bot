import { EmbedBuilder } from 'discord.js';
import { query } from '../database.js';
import { CronJob } from "cron";
import axios from "axios";

// hacer consultas cada cierto tiempo por si el capitulo sube.
// Si sube, enviar confirmación via MD al usuario suscrito
// Si el manga finaliza, eliminar el registro y avisar.

// Función para consultar la base de datos
function checkNewChapters() {
  try {
    // Obtener el último capitulo registrado
    query ("SELECT FROM mangasuscription WHERE ")
    
    
  } catch {error} {
    console.log(error);
  }
}

function sendMessage() {
  const embed = new EmbedBuilder()
  .setColor(0x779ecb)
  .setAuthor({
    name: `${client.user.username} - ${interaction.commandName}`,
    iconURL: client.user.displayAvatarURL()
  })
  .setTitle("Se ha subido un nuevo capítulo de un manga que estás leyendo")

  
  interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
}