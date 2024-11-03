import { SlashCommandBuilder, EmbedBuilder } from "discord.js"

export const data = new SlashCommandBuilder()
.setName('download-worlds')
.setDescription('Muestra un menú para descargar los mapas de viejos servidores de Minecraft.')

export function run(client, interaction) {
  if (interaction.guildId == '846586184963981322', '787098787881287711') {
    const embed = new EmbedBuilder()
    .setColor(0x94bf63)
    .setAuthor({
      name: `${client.user.username} - ${interaction.commandName}`,
      iconURL: client.user.displayAvatarURL()
    })
    .setTitle('Enlaces de descarga:')
    .addFields(
      { name: `<:GrassBlock:1302448544141279303> SMP v1┆1.16.5`, value: `[Link de descarga](https://mega.nz/folder/WuowFA5b#SK_LOJPmrP7aT2aQZUK94w).`, inline: true },
      { name: `<:GrassBlock:1302448544141279303> SMP v2┆1.16.5`, value: `[Link de descarga](https://mega.nz/folder/T64WEBwK#RznA0zRt0yedegFTv62QAA).`, inline: true },
      { name: `<:GrassBlock:1302448544141279303> SMP v3┆1.16.5`, value: `[Link de descarga](https://mega.nz/folder/evZQxJjD#eFgaBcny-Zyt5XfOqJW_Dg).`, inline: true },
      { name: `<:Yunque:1302449015010623530> SMP Mods V1┆1.12.2 Curseforge`, value: `[Link de descarga](https://mega.nz/folder/O7BmDACJ#1wf_JLFST4XC0rk42xPx_A).`, inline: true }
    )
    interaction.reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
  }
  
  else {
    interaction.reply({ content: "<:Advertencia:1302055825053057084> Lo siento, este comando es privado.", ephemeral: true, allowedMentions: { repliedUser: false } })
  }
}