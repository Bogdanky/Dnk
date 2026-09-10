require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
    console.error('Lipseste DISCORD_TOKEN sau CLIENT_ID din fisierul .env. Vezi .env.example.');
    process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Se inregistreaza ${commands.length} comenzi slash...`);

        const route = GUILD_ID
            ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID) // instant, doar pe un server (bun pt. dezvoltare)
            : Routes.applicationCommands(CLIENT_ID); // global, poate dura pana la 1h sa apara

        const data = await rest.put(route, { body: commands });

        console.log(`S-au inregistrat cu succes ${data.length} comenzi slash.`);
    } catch (error) {
        console.error(error);
    }
})();
