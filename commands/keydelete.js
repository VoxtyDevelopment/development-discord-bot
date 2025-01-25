const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');

const connectionConfig = {
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbDatabase
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keydelete')
        .setDescription('Deletes a specific license key')
        .addStringOption(option =>
            option.setName('key')
                .setDescription('The license key to delete')
                .setRequired(true)),
    async execute(interaction) {
        const member = interaction.member;
        const key = interaction.options.getString('key');
        const hasRole = member.roles.cache.some(role =>
            role.id === config.executiveRole || role.id === config.adminRole
        );

        if (!hasRole) {
            await interaction.reply('You do not have permission to use this command.');
            return;
        }

        try {
            const connection = await mysql.createConnection(connectionConfig);

            const [rows] = await connection.execute(
                'DELETE FROM Licenses WHERE `key` = ?',
                [key]
            );

            await connection.end();

            if (rows.affectedRows > 0) {
                await interaction.reply(`Key ${key} deleted successfully!`);
            } else {
                await interaction.reply(`No license key found with Key: ${key}`);
            }
        } catch (error) {
            console.error('Error deleting license key:', error);
            await interaction.reply('There was an error deleting the license key. Please try again later.');
        }
    }
};
