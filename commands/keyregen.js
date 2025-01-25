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
const generateKey = () => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${randomPart}`;
};

module.exports = {
   data: new SlashCommandBuilder()
       .setName('regenkey')
       .setDescription('Change a license key to a new value')
       .addStringOption(option =>
           option.setName('key')
               .setDescription('The current key to change')
               .setRequired(true)),
   async execute(interaction) {
       const user = interaction.user;
       const currentKey = interaction.options.getString('key');

       const hasRole = user.roles.cache.some(role => 
           role.id === config.executiveRole || role.id === config.adminRole
       );

       if (!hasRole) {
           await interaction.reply('You do not have permission to use this command.');
           return;
       }

       try {
           const connection = await mysql.createConnection(connectionConfig);

           const newKey = generateKey();

           const [rows] = await connection.execute(
               'UPDATE Licenses SET `key` = ? WHERE `key` = ?',
               [newKey, currentKey]
           );

           await connection.end();

           if (rows.affectedRows > 0) {
               await interaction.reply(`Key ${currentKey} successfully changed to ${newKey}.`);
           } else {
               await interaction.reply(`No key found with Key: ${currentKey}`);
           }
       } catch (error) {
           console.error('Error changing key:', error);
           await interaction.reply('There was an error changing the key. Please try again later.');
       }
   }
};
