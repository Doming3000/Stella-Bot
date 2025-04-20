import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import axios from "axios";

export const data = new SlashCommandBuilder()
.setName('zonatmo')
.setDescription('Se conecta a ZonaTMO para obtener información de mangas.')

export async function run(client, interaction) {
  try {
    // Indicar que se está procesando la solicitud
    await interaction.deferReply();
    
    // Esto no funciona, corregir por valor real una vez la api esté desplegada.
    const {data} = await axios.get('https://tumangaonline-api.herokuapp.com/api/v1/manga/populares');
    
    // Comprobar si hay elementos
    if (!data.data || data.data.length === 0) {
      return interaction.editReply({ content: "<:Advertencia:1302055825053057084> No se encontraron elementos para mostrar", allowedMentions: { repliedUser: false }});
    }
    
    // Tomar los primeros 5 mangas para mostrar en un embed
    const mangas = data.data.slice(0, 5);
    
    // Embed temporal para mostrar los resultados
    const embed = new EmbedBuilder()
    .setTitle('📚 Mangas Populares en TuMangaOnline')
    .setColor(0x0099ff)
    
    mangas.forEach((manga, index) => {
      embed.addFields({
        name: `${index + 1}. ${manga.title}`,
        value: `[Leer en Zona TMO](${manga.mangaUrl})`,
      });
    });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    interaction.editReply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar este comando.", allowedMentions: { repliedUser: false }});
    console.log(error);
  }
}