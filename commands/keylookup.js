const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');

const connectionConfig = {
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbDatabase
};
// should probably update this go off API calls but really lazy and don't want to do that
module.exports = {
   data: new SlashCommandBuilder()
       .setName('keylookup')
       .setDescription('Lookup all keys and products under a username')
       .addStringOption(option =>
           option.setName('username')
               .setDescription('The username to lookup')
               .setRequired(true)),
   async execute(interaction) {
       const user = interaction.user;
       const username = interaction.options.getString('username');
       const hasRole = user.roles.cache.some(role => 
           role.id === config.executiveRole || role.id === config.adminRole
       );

       if (!hasRole) {
           await interaction.reply('You do not have permission to use this command.');
           return;
       }

       try {
           const connection = await mysql.createConnection(connectionConfig);

           const [rows] = await connection.execute(
               'SELECT product, `key`, `authorized_ip` FROM Licenses WHERE username = ?',
               [username]
           );

           await connection.end();

           if (rows.length > 0) {
               let response = `Keys and Products for ${username}:\n`;
               rows.forEach(row => {
                   response += `**Product:** ${row.product}\n**Key:** ${row.key}\n**Authorized IP**: ${row.authorized_ip}\n`;
               });
               await interaction.reply(response);
           } else {
               await interaction.reply(`No keys found for ${username}`);
           }
       } catch (error) {
           console.error('Error fetching keys:', error);
           await interaction.reply('There was an error fetching keys. Please try again later.');
       }
   }
};
