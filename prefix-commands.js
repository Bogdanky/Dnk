const { EmbedBuilder } = require('discord.js');

// Set restrans de comenzi disponibile si ca prefix commands, pe langa slash commands.
// Nu toate cele 20+ slash commands au nevoie de varianta cu prefix - astea sunt cele
// mai des folosite rapid, fara sa deschizi meniul de slash commands.

const EIGHTBALL_REPLIES = [
    'Da', 'Nu', 'Intreaba din nou mai tarziu', 'Sigur', 'Nu conta pe asta',
    'Semnele indica da', 'Perspectiva nu e buna',
];

const prefixCommands = new Map();

prefixCommands.set('ping', {
    description: 'Verifica daca botul raspunde',
    async execute(message) {
        const sent = await message.reply('Ping...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        await sent.edit(`🏓 Pong! Latenta: ${latency}ms | API: ${Math.round(message.client.ws.ping)}ms`);
    },
});

prefixCommands.set('avatar', {
    description: 'Arata avatarul tau sau al unui membru mentionat',
    async execute(message) {
        const target = message.mentions.users.first() ?? message.author;
        const embed = new EmbedBuilder()
            .setTitle(`Avatarul lui ${target.tag}`)
            .setImage(target.displayAvatarURL({ size: 512 }))
            .setColor(0xFF9900);
        await message.reply({ embeds: [embed] });
    },
});

prefixCommands.set('8ball', {
    description: 'Bila magica raspunde la o intrebare',
    async execute(message, args) {
        if (args.length === 0) {
            return message.reply('Trebuie sa pui si o intrebare, ex: `!8ball ma imbogatesc anul asta?`');
        }
        const answer = EIGHTBALL_REPLIES[Math.floor(Math.random() * EIGHTBALL_REPLIES.length)];
        await message.reply(`🎱 ${answer}`);
    },
});

prefixCommands.set('coinflip', {
    description: 'Arunca o moneda',
    async execute(message) {
        const result = Math.random() < 0.5 ? 'Cap' : 'Pajura';
        await message.reply(`🪙 A iesit **${result}**!`);
    },
});

prefixCommands.set('help', {
    description: 'Arata comenzile disponibile cu prefix',
    async execute(message, args, prefix) {
        const lines = Array.from(prefixCommands.entries()).map(([name, cmd]) => `\`${prefix}${name}\` - ${cmd.description}`);
        const embed = new EmbedBuilder()
            .setTitle('Comenzi cu prefix disponibile')
            .setDescription(lines.join('\n'))
            .setFooter({ text: 'Pentru restul functiilor botului, foloseste slash commands (/)' })
            .setColor(0xFF9900);
        await message.reply({ embeds: [embed] });
    },
});

module.exports = { prefixCommands };
