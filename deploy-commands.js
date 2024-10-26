import { Routes, Client, GatewayIntentBits } from 'discord.js';
import { readdirSync } from 'fs';
import { REST } from '@discordjs/rest';
import { config } from 'dotenv';

config();

const clientId = process.env.CLIENT_ID;
const token = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// Función para cargar todos los comandos desde el directorio 'commands'
async function loadCommands() {
  let commandsData = [];
  
  // Leer directorios de comandos
  const commandDirs = readdirSync('./commands');
  
  for (const dir of commandDirs) {
    const commandFiles = readdirSync(`./commands/${dir}/`).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const command = await import(`./commands/${dir}/${file}`);
      // Convertir el comando a JSON
      commandsData.push(command.data.toJSON());
    }
  }
  
  return commandsData;
}

// Función para registrar comandos globales
async function registerGlobalCommands(commandsData) {
  const rest = new REST({ version: '10' }).setToken(token);
  
  try {
    console.log('Registrando comandos globales...');
    await rest.put(
      // Registrar comandos globales
      Routes.applicationCommands(clientId),
      { body: commandsData }
    );
    console.log('Comandos globales registrados con éxito.');
  } catch (error) {
    console.error('Error al registrar comandos globales:', error);
  }
}

// Iniciar sesión con el cliente de Discord y registrar comandos
client.login(token).then(async () => {
  try {
    // Cargar los comandos desde el directorio
    const commandsData = await loadCommands();
    
    // Registrar comandos globales
    await registerGlobalCommands(commandsData);
  } catch (error) {
    console.error('Error durante el proceso de registro de comandos:', error);
  } finally {
    client.destroy();
  }
});