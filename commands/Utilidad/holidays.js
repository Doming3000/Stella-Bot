import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import axios from "axios";

export const data = new SlashCommandBuilder()
.setName('holidays')
.setDescription('Muestra los feriados del mes.')
.addStringOption (option =>
  option.setName('country')
  .setDescription('País a consultar.')
  .setRequired(true)
  .addChoices(
    { name: 'Argentina', value: 'AR' },
    { name: 'Bolivia', value: 'BO' },
    { name: 'Chile', value: 'CL' },
    { name: 'Colombia', value: 'CO' },
    { name: 'Costa Rica', value: 'CR' },
    { name: 'Cuba', value: 'CU' },
    { name: 'Ecuador', value: 'EC' },
    { name: 'El Salvador', value: 'SV' },
    { name: 'España', value: 'ES' },
    { name: 'Estados Unidos', value: 'US' },
    { name: 'Guatemala', value: 'GT' },
    { name: 'Honduras', value: 'HN' },
    { name: 'México', value: 'MX' },
    { name: 'Nicaragua', value: 'NI' },
    { name: 'Panamá', value: 'PA' },
    { name: 'Paraguay', value: 'PY' },
    { name: 'Perú', value: 'PE' },
    { name: 'República Dominicana', value: 'DO' },
    { name: 'Uruguay', value: 'UY' },
    { name: 'Venezuela', value: 'VE' }
  )
)
.addStringOption (option =>
  option.setName('month')
  .setDescription('Filtrar por mes (Por defecto: Actual).')
  .setRequired(false)
  .addChoices(
    { name: 'Enero', value: '1' },
    { name: 'Febrero', value: '2' },
    { name: 'Marzo', value: '3' },
    { name: 'Abril', value: '4' },
    { name: 'Mayo', value: '5' },
    { name: 'Junio', value: '6' },
    { name: 'Julio', value: '7' },
    { name: 'Agosto', value: '8' },
    { name: 'Septiembre', value: '9' },
    { name: 'Octubre', value: '10' },
    { name: 'Noviembre', value: '11' },
    { name: 'Diciembre', value: '12' }
  )
);

function formatDate(fdate) {
  const formatted = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(fdate)).replace(',', '');
  
  return formatted.replace(/^\w/, c => c.toUpperCase());
}

export async function run(client, interaction) {
  try {
    const date = new Date();
    const year = date.getFullYear();
    
    const selectedMonth = interaction.options.getString('month') || date.toLocaleDateString('es-ES', { month: 'long' }).replace(/^\w/, c => c.toUpperCase());;
    const months = { Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6, Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12 };
    const numMonth = months[selectedMonth];
    
    const country = interaction.options.getString('country');
    const countryEmoji = ':flag_' + country.toLowerCase() + ':';
    
    // Consultar la API
    await interaction.deferReply();
    
    const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`);
    const holidays = response.data;
    
    // Filtrar por los feriados del mes
    const feriadosMes = holidays.filter(f => {
      const mesFeriado = Number(f.date.split("-")[1]);
      return mesFeriado === numMonth;
    });
    
    const sinFeriados = feriadosMes.length === 0
    
    // Crear embed
    const embed = new EmbedBuilder()
    .setColor(0x2a5993)
    .setAuthor({ name: `${client.user.username} - ${interaction.commandName}`, iconURL: client.user.displayAvatarURL()})
    .setTitle(`${countryEmoji} Feriados de ${selectedMonth}`)
    .addFields(sinFeriados ? { name: '🪧 - Sin feriados', value: 'No hay ningún feriado este mes.', inline: false } : feriadosMes.map(f => ({name: `🗓️ - ${formatDate(f.date)}`, value: `- ${f.localName || f.name}`})))
    .setFooter({ text: 'Fuente: Nager.Date API.' });
    
    // Enviar mensaje
    interaction.editReply({ embeds: [embed], allowedMentions: { repliedUser: false }});
  } catch (error) {
    interaction.editReply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar este comando.", allowedMentions: { repliedUser: false }});
    console.warn(error);
  }
}