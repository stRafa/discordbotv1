const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const dotenv =  require('dotenv');
dotenv.config();
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const fs = require('node:fs');
const path = require('node:path');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

registerCommands(client);

registerEvents(client);

// Log in to Discord with your client's token
client.login(TOKEN);


client.on(Events.InteractionCreate, (interaction) => handleInteraction(interaction));


async function handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const errorMessage = 'There was an error while executing this command!';
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
}

function registerCommands(client) {
    const commandsPath = path.join(__dirname, "src", "commands");
    const commandFolders = fs.readdirSync(commandsPath);

    commandFolders.forEach(folder => {
        const filePath = path.join(commandsPath, folder, `${folder}.command.js`);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command)
            console.log(`[INFO] Command ${command.data.name} Registed`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    });
    console.log("");
}

function registerEvents(client) {
    const eventsPath = path.join(__dirname, "src", "events");
    const eventFolders = fs.readdirSync(eventsPath);

    eventFolders.forEach((folder) => {
        const filePath = path.join(eventsPath, folder, `${folder}.event.js`);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`[INFO] Event ${event.name} Registed`);
    });
    console.log("");
}


