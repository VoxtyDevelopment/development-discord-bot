// should probably update this go off API calls but really lazy and don't want to do that
const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateip')
        .setDescription('Updates an IP address in the database.')
        .addStringOption(option =>
            option.setName('key')
                .setDescription('The key to change.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('ip')
                .setDescription('The IP to update.')
                .setRequired(true)),
    async execute(interaction) {
        const memberRoles = interaction.member.roles.cache;
        const key = interaction.options.getString('key');
        const newip = interaction.options.getString('ip');

    
        const hasPermission = memberRoles.has(config.executiveRole) || memberRoles.has(config.adminRole);
        if (!hasPermission) {
            await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
            return;
        }

        try {
            const connection = await mysql.createConnection({
                host: config.dbhost,
                port: config.dbport,
                user: config.dbuser,
                password: config.dbpassword,
                database: config.dbname
            });

            const [rows] = await connection.execute(
                'UPDATE Licenses SET authorized_ip = ? WHERE `key` = ?',
                [newip, key]
            );

            await connection.end();
            if (rows.affectedRows > 0) {
                await interaction.reply(`Key \`${key}\` updated with new IP: \`${newip}\`!`);
            } else {
                await interaction.reply(`No license key found with key: \`${key}\`.`);
            }
        } catch (error) {
            console.error('Error updating IP:', error);
            await interaction.reply('There was an error updating the IP address for the license key. Please try again later.');
        }
    },
};
