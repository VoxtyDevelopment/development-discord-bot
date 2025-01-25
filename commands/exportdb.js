const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
// should probably update this go off API calls but really lazy and don't want to do that
async function exportDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: config.dbhost,
            port: config.dbport,
            user: config.dbuser,
            password: config.dbpassword,
            database: config.dbname
        });

        const [rows, fields] = await connection.execute('SHOW TABLES');
        let tableNames = rows.map(row => row[`Tables_in_${config.dbname}`]);

        let sqlContent = '';

        for (let tableName of tableNames) {
            const [tableRows] = await connection.execute(`SELECT * FROM ${tableName}`);
            sqlContent += `-- Table structure for ${tableName}\n`;
            const [tableStructure] = await connection.execute(`SHOW CREATE TABLE ${tableName}`);
            sqlContent += `${tableStructure[0]['Create Table']};\n\n`;

            sqlContent += `-- Dumping data for ${tableName}\n`;
            for (let row of tableRows) {
                let rowValues = Object.values(row).map(value => {
                    if (value === null) return 'NULL';
                    return typeof value === 'string' ? `'${value}'` : value;
                }).join(', ');
                sqlContent += `INSERT INTO ${tableName} VALUES (${rowValues});\n`;
            }
            sqlContent += '\n';
        }

        await connection.end();

        const exportFilePath = path.join(__dirname, '..', 'database_export.sql'); // THIS IS WHERE THE FILE SAVES CHANGE IF YOU WANT 
        fs.writeFileSync(exportFilePath, sqlContent);

        return exportFilePath;
    } catch (error) {
        console.error('Error exporting database:', error);
        throw error;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('exportdb')
        .setDescription('This Will Export/Backup The ENTIRE Database'),
    async execute(interaction) {
        const hasRole = interaction.member.roles.cache.some(role => 
            [config.adminRole, config.executiveRole].includes(role.id)
        );

        if (!hasRole) {
            await interaction.reply('You are not authorized to use this command.');
            return;
        }

        try {
            const exportFilePath = await exportDatabase();
            await interaction.channel.send({
                content: 'Here is the SQL file containing the entire database:',
                files: [exportFilePath]
            });
        } catch (error) {
            console.error('Error handling export database command:', error);
            await interaction.reply('There was an error exporting the database. Please try again later.');
        }
    }
};
