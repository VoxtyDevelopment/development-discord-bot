const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Purge messages from a channel')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('The amount of messages to purge')
                .setRequired(true)
        ),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const memberRoles = interaction.member.roles.cache;

        if (!(
            memberRoles.has(config.supportRole) ||
            memberRoles.has(config.devRole) ||
            memberRoles.has(config.adminRole) ||
            memberRoles.has(config.executiveRole)
        )) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        if (amount > 100) {
            return interaction.reply({ content: 'You can only purge up to 100 messages at once.', ephemeral: true });
        }

        try {
            await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `Purged ${amount} messages.`, ephemeral: true });
            const modLogsChannel = interaction.guild.channels.cache.get(config.logs);
            if (modLogsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Messages Purged')
                    .setColor(config.embedColor)
                    .setThumbnail(config.logo)
                    .setFooter({ text: config.companyName, iconURL: config.logo })
                    .setTimestamp()
                    .addFields(
                        { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: 'Channel', value: `${interaction.channel.name} (${interaction.channel.id})`, inline: true },
                        { name: 'Amount', value: `${amount} messages`, inline: true }
                    );

                await modLogsChannel.send({ embeds: [logEmbed] });
            }
        } catch (error) {
            console.error('Error purging messages:', error);
            return interaction.reply({ content: 'An error occurred while trying to purge messages.', ephemeral: true });
        }
    }
};
