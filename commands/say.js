const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot send a message')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message you want the bot to send')
                .setRequired(true)),
    
    async execute(interaction) {
        const messageContent = interaction.options.getString('message');
        const memberRoles = interaction.member.roles.cache;
        const hasPermission = memberRoles.has(config.executive) || memberRoles.has(config.admin);
        
        if (!hasPermission) {
            return interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                ephemeral: true 
            });
        }

        try {
            await interaction.reply({ content: 'Message sent!', ephemeral: true });
            await interaction.channel.send(messageContent);
            const logChannel = interaction.guild.channels.cache.get(config.logs);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('Command Usage: /say')
                    .setThumbnail(config.logo)
                    .addFields(
                        { name: 'User', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                        { name: 'Channel', value: `<#${interaction.channel.id}>`, inline: true },
                        { name: 'Message', value: messageContent }
                    )
                    .setColor(config.embedcolor)
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            } else {
                console.warn('Log channel not found or misconfigured.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            interaction.reply({ content: 'Failed to send the message.', ephemeral: true });
        }
    },
};
