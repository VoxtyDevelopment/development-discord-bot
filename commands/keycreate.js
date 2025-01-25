// should probably update this go off API calls but really lazy and don't want to do that
const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');

async function initializeDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: config.dbhost,
            port: config.dbport,
            user: config.dbuser,
            password: config.dbpassword,
            database: config.dbname
        });

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS Licenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                product VARCHAR(255) NOT NULL,
                \`key\` VARCHAR(255) NOT NULL,
                authorized_ip VARCHAR(255) NOT NULL
            )
        `);

        await connection.end();
        console.log('Database initialized successfully.');
    } catch (error) {
        console.error('Error initializing the database:', error);
    }
}

const generateKey = () => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${randomPart}`;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keycreate')
        .setDescription('Generates a license key')
        .addUserOption(option =>
            option.setName('username')
                .setDescription('The new username')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('product')
                .setDescription('The product')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('ip')
                .setDescription('IP Address')
                .setRequired(true)
        ),
    async execute(interaction) {
        const memberRoles = interaction.member.roles.cache;
        const hasPermission = memberRoles.has(config.executiveRole) || memberRoles.has(config.adminRole);
        if (!hasPermission) {
            await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
            return;
        }

        const newuser = interaction.options.getUser('username');
        const product = interaction.options.getString('product');
        const ip = interaction.options.getString('ip');
        const key = generateKey();

        try {
            const connection = await mysql.createConnection({
                host: config.dbhost,
                port: config.dbport,
                user: config.dbuser,
                password: config.dbpassword,
                database: config.dbname
            });

            await connection.execute(
                'INSERT INTO Licenses (username, product, `key`, authorized_ip) VALUES (?, ?, ?, ?)',
                [newuser.username, product, key, ip]
            );

            await connection.end();

            await interaction.reply(`License key generated:\nUsername: ${newuser.username}\nProduct: ${product}\nIP: ${ip}\nKey: ${key}`);
        } catch (error) {
            console.error('Error creating license:', error);
            await interaction.reply('There was an error generating the license key. Please try again later.');
        }
    }
};

module.exports.initializeDatabase = initializeDatabase;
