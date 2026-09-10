require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, ActivityType } = require('discord.js');

const client = new Client({
    // Pentru slash commands nu avem nevoie de intent-ul MessageContent -
    // Guilds e suficient pentru interactiuni si prezenta botului.
    intents: [GatewayIntentBits.Guilds],
});

// Colectie in care incarcam toate comenzile, cheia fiind numele comenzii.
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        command.filePath = filePath; // folosit de /reload ca sa stie ce fisier sa re-incarce
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`[AVERTISMENT] Comanda din ${filePath} nu are proprietatile "data" sau "execute".`);
    }
}

client.once('clientReady', () => {
    console.log(`Botto e online ca ${client.user.tag}`);
    client.user.setPresence({
        activities: [{ name: `${client.guilds.cache.size} servere`, type: ActivityType.Watching }],
        status: 'online',
    });

    // Verifica din 30 in 30 de secunde daca vreun giveaway a expirat si trebuie incheiat automat.
    const giveawayCommand = client.commands.get('giveaway');
    if (giveawayCommand?.checkExpiredGiveaways) {
        setInterval(() => giveawayCommand.checkExpiredGiveaways(client), 30_000);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Nu a fost gasita nicio comanda cu numele ${interaction.commandName}.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Eroare la executarea comenzii ${interaction.commandName}:`, error);

        const errorReply = { content: 'A aparut o eroare la executarea acestei comenzi.', ephemeral: true };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorReply);
        } else {
            await interaction.reply(errorReply);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
