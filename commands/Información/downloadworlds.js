import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

export const data = new SlashCommandBuilder()
.setName('download-worlds')
.setDescription('Muestra información de servidores de Minecraft y sus enlaces de descarga.');

export async function run(client, interaction) {
  // Servidores permitidos
  const allowedGuilds = ['846586184963981322', '787098787881287711'];
  
  if (!allowedGuilds.includes(interaction.guildId) && interaction.user.id !== '811071747189112852') {
    return interaction.reply({ content: "<:Advertencia:1302055825053057084> Lo siento, este comando solo puede ser ejecutado en un servidor autorizado.", flags: 64, allowedMentions: { repliedUser: false }});
  }
  
  // Array de páginas
  const pages = [
    {
      // Primer servidor
      embedData: {
        title: 'SMP Moon Republic v1 (2020)',
        fields: [
          { name: '🖥️ - Software:', value: 'Vanilla', inline: true },
          { name: '🏷️ - Versión:', value: '1.16.5', inline: true },
          { name: '📦 - Tamaño del archivo:', value: '3,07GB', inline: true }
        ]
      },
      // Botón descargar
      download: {
        emoji: '<:Mega:1390495778551889981>',
        url: 'https://mega.nz/folder/WuowFA5b#SK_LOJPmrP7aT2aQZUK94w',
      }
    },
    {
      // Segundo servidor
      embedData: {
        title: 'SMP Moon Republic v2 (2020)',
        fields: [
          { name: '🖥️ - Software:', value: 'Vanilla', inline: true },
          { name: '🏷️ - Versión:', value: '1.16.5', inline: true },
          { name: '📦 - Tamaño del archivo:', value: '9,48GB', inline: true }
        ]
      },
      download: {
        emoji: '<:Mega:1390495778551889981>',
        url: 'https://mega.nz/folder/T64WEBwK#RznA0zRt0yedegFTv62QAA',
      } 
    },
    {
      // Tercer servidor
      embedData: {
        title: 'SMP Moon Republic v3 (2021)',
        fields: [
          { name: '🖥️ - Software:', value: 'Forge', inline: true },
          { name: '🏷️ - Versión:', value: '1.12.2', inline: true },
          { name: '📦 - Tamaño del archivo:', value: '3,05GB', inline: true }
        ]
      },
      download: {
        emoji: '<:Mega:1390495778551889981>',
        url: 'https://mega.nz/folder/O7BmDACJ#1wf_JLFST4XC0rk42xPx_A',
      } 
    },
    {
      // Cuarto servidor
      embedData: {
        title: 'SMP Gecko Gang v1 (2021)',
        fields: [
          { name: '🖥️ - Software:', value: 'Vanilla', inline: true },
          { name: '🏷️ - Versión:', value: '1.16.5', inline: true },
          { name: '📦 - Tamaño del archivo:', value: '3,99GB', inline: true }
        ]
      },
      download: {
        emoji: '<:Mega:1390495778551889981>',
        url: 'https://mega.nz/folder/evZQxJjD#eFgaBcny-Zyt5XfOqJW_Dg',
      }
    },
    {
      // Quinto servidor
      embedData: {
        title: 'Better Minecraft Server (2023)',
        fields: [
          { name: '🖥️ - Software:', value: 'Forge', inline: true },
          { name: '🏷️ - Versión:', value: '1.16.5', inline: true },
          { name: '📦 - Tamaño del archivo:', value: '6,89GB', inline: true }
        ]
      },
      download: {
        emoji: '<:OneDrive:1390497430138781828>',
        url: 'https://1drv.ms/f/s!AgC3zI8Y8Mt2nr9rKAwx6Pk5fOxiuQ?e=Ns5B6h',
      }
    },
    {
      // Sexto servidor
      embedData: {
        title: 'SMP Repollitos v1 (2025)',
        fields: [
          { name: '🖥️ - Software:', value: 'Forge', inline: true },
          { name: '🏷️ - Versión:', value: '1.20.1', inline: true },
          { name: '📦 - Tamaño del archivo:', value: '16,7GB', inline: true }
        ]
      },
      download: {
        emoji: '<:OneDrive:1390497430138781828>',
        url: 'https://1drv.ms/f/s!AgC3zI8Y8Mt2paN9lpZaZS_EY73lxg?e=OsiZ2D',
      }
    },
  ];
  
  let currentPage = 0;
  
  // Generar el embed de forma dinámica
  const generateEmbed = (index) => {
    const page = pages[index];
    return new EmbedBuilder()
    .setColor(0x94bf63)
    .setAuthor({ name: `${client.user.username} - ${interaction.commandName}`, iconURL: client.user.displayAvatarURL() })
    .setTitle(page.embedData.title)
    .setFields(page.embedData.fields)
    .setFooter({ text: `Página ${index + 1} de ${pages.length}` });
  };
  
  // Botones
  const getActionRow = () => {
    const { download } = pages[currentPage];
    
    return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
      .setEmoji('<:Retroceder:1390497510077759628>')
      .setCustomId('goLeft')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0),
      
      new ButtonBuilder()
      .setEmoji(download.emoji)
      .setLabel('Descargar')
      .setURL(download.url)
      .setStyle(ButtonStyle.Link),
      
      new ButtonBuilder()
      .setEmoji('<:Avanzar:1390497492671533096>')
      .setCustomId('goRight')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === pages.length - 1),
    );
  };
  
  // Enviar mensaje
  await interaction.reply({ embeds: [generateEmbed(currentPage)], components: [getActionRow()], allowedMentions: { repliedUser: false }});
  const message = await interaction.fetchReply();
  
  // Evento del colector
  const collector = message.createMessageComponentCollector({ time: 2 * 60 * 1000 });
  
  collector.on('collect', async i => {
    // Asegurarse de que solo el usuario que hizo la interacción pueda manejarla
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: `<:Advertencia:1302055825053057084> <@${i.user.id}> No puedes interferir con las solicitudes de otros usuarios.`, flags: 64 });
    }
    
    // Reiniciar temporizador al hacer clic
    collector.resetTimer();
    
    if (i.customId === 'goLeft' && currentPage > 0) {
      currentPage--;
    } else if (i.customId === 'goRight' && currentPage < pages.length - 1) {
      currentPage++;
    }
    
    await i.update({ embeds: [generateEmbed(currentPage)], components: [getActionRow()] });
  });
  
  // Finalizar el colector
  collector.on('end', async () => {
    const disabledRow = getActionRow();
    disabledRow.components.forEach(c => {
      if (c.data.style !== ButtonStyle.Link) c.setDisabled(true);
    });
    
    await message.edit({ components: [disabledRow] }).catch(() => {});
  });
}