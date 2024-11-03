import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import request from "request";

export const data = new SlashCommandBuilder()
.setName('mcskin')
.setDescription('Muestra la skin de un jugador de Minecraft premium.')
.addStringOption(option => 
  option.setName('nombre')
  .setDescription('Nick del jugador premium.')
  .setRequired(true)
);

export function run(client, interaction) {
  const nombre = interaction.options.getString('nombre');
  
  const caracteres = nombre.length;
  if (caracteres > 16) {
    interaction.reply({ content: "<:Advertencia:1302055825053057084> El nombre de este jugador sobrepasa los 16 caracteres.", ephemeral: true, allowedMentions: { repliedUser: false }});
    return;
  }
  
  let mojang_player_api = `https://api.mojang.com/users/profiles/minecraft/${nombre}`;
  request(mojang_player_api, function (err, resp, body) {
    // Si hay un error con la solicitud, enviar un mensaje de error.
    if (err) {
      interaction.reply({ content: "<:Advertencia:1302055825053057084> Ocurrió un error al consultar la API.", ephemeral: true, allowedMentions: { repliedUser: false }});
      return;
    }
    
    try {
      body = JSON.parse(body);
      
      // Verificar si el jugador no existe
      if (!body || !body.id) {
        interaction.reply({ content: "<:Advertencia:1302055825053057084> No he podido encontrar al jugador.", ephemeral: true, allowedMentions: { repliedUser: false }});
        return;
      }
      
      let player_id = body.id;
      let render = `https://mc-heads.net/body/${player_id}/128.png`;
      let skin = `https://crafatar.com/skins/${player_id}.png`;
      let avatar = `https://mc-heads.net/avatar/${player_id}.png`;
      
      let embed = new EmbedBuilder()
      .setColor(0x94bf63)
      .setAuthor({
        name: `${client.user.username} - ${interaction.commandName}`,
        iconURL: client.user.displayAvatarURL()
      })
      .setTitle(`Skin del jugador: ${body.name}`)
      .setDescription(`<:Imagen:1302064339829653535> [Abrir en el navegador](${skin})`)
      .setImage(render)
      .setThumbnail(avatar);
      
      interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    } catch (err) {
      interaction.reply({ content: "<:Advertencia:1302055825053057084> Ha ocurrido un error al ejecutar el comando.", ephemeral: true, allowedMentions: { repliedUser: false }});
    }
  });
}