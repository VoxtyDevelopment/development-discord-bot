const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
// should probably update this go off API calls but really lazy and don't want to do that
const connectionConfig = {
    host: config.dbhost,
    port: config.dbport,
    user: config.dbuser,
    password: config.dbpassword,
    database: config.dbname
};

module.exports = {
   data: new SlashCommandBuilder()
       .setName('editusername')
       .setDescription('Edits a username on the license key.')
       .addUserOption(option =>
        option.setName('username')
        .setDescription('The new username')
        .setRequired(true))
       .addStringOption(option =>
           option.setName('key')
               .setDescription('The current key to change')
               .setRequired(true)),
   async execute(interaction) {
       const userId = interaction.user.id;
       const currentKey = interaction.options.getString('key');
       const newuser = interaction.options.getUser('username');

       const hasRole = interaction.member.roles.cache.some(role =>
           [config.adminRole, config.executiveRole].includes(role.id)
       );

       if (!hasRole) {
           await interaction.reply('You are not authorized to use this command.');
           return;
       }

       try {
           const connection = await mysql.createConnection(connectionConfig);

           const [rows] = await connection.execute(
               'UPDATE Licenses SET `username` = ? WHERE `key` = ?',
               [newuser.username, currentKey]
           );

           await connection.end();

           if (rows.affectedRows > 0) {
               await interaction.reply(`Username successfully updated on key ${currentKey} to ${newuser.username}.`);
           } else {
               await interaction.reply(`No key found with Key: ${currentKey}`);
           }
       } catch (error) {
           console.error('Error changing username:', error);
           await interaction.reply('There was an error changing the username. Please try again later.');
       }
   }
};
