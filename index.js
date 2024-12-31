import { Client, GatewayIntentBits, Collection } from "discord.js";
import { readdirSync, readFileSync } from "fs";
// import { databaseConnect } from './database.js'
import { pathToFileURL } from "url";
import path from "path";

// Configuración y cliente de Discord
const config = JSON.parse(readFileSync('./config.json'));
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.commands = new Collection();

// Inicia sesión con el token desde config.json
client.login(config.token).then(() => console.log("🟢 La aplicación está en línea."));

// Función para cargar comandos
function loadCommands() {
  const commandDir = path.resolve('./commands');
  readdirSync(commandDir).forEach((dir) => {
    const commandsPath = path.join(commandDir, dir);
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = pathToFileURL(`${commandsPath}/${file}`).href;
      import(filePath).then((commandModule) => {
        const command = commandModule.default || commandModule;
        if (command?.data) {
          client.commands.set(command.data.name, command);
          console.log(`Comando cargado: ${command.data.name}`);
        } else {
          console.warn(`El comando ${file} no tiene una propiedad 'data'`);
        }
      }).catch(error => {
        console.error(`Error al cargar el comando ${file}: ${error.message}`);
      });
    }
  });
}

// Función para cargar eventos
function loadEvents() {
  const eventsPath = path.resolve('./events');
  const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    const filePath = pathToFileURL(`${eventsPath}/${file}`).href;
    import(filePath).then((eventModule) => {
      const event = eventModule.default || eventModule;
      if (event?.name && event?.execute) {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args, client));
        } else {
          client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`Evento cargado: ${event.name}`);
      } else {
        console.warn(`El evento ${file} no tiene una propiedad 'name' o 'execute'`);
      }
    }).catch(error => {
      console.error(`Error al cargar el evento ${file}: ${error.message}`);
    });
  }
}

// Llamada a las funciones de carga
// databaseConnect();
loadCommands();
loadEvents();