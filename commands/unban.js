const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user')
        .addUserOption(option => option.setName('user').setDescription('The user to unban').setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const memberRoles = interaction.member.roles.cache;

        if (!(
            memberRoles.has(config.adminRole) ||
            memberRoles.has(config.executiveRole)
        )) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        try {
            const banList = await interaction.guild.bans.fetch();
            const bannedUser = banList.get(user.id);
            if (!bannedUser) {
                return interaction.reply({ content: `The user ${user.tag} is not banned.`, ephemeral: true });
            }
            const banReason = bannedUser.reason || 'No reason provided';
            await interaction.guild.bans.remove(user.id);
            const embed = new EmbedBuilder()
                .setTitle('User Unbanned')
                .setDescription(`${user.tag} has been unbanned from the server.`)
                .setColor(config.embedColor)
                .setTimestamp()
                .setFooter({ text: config.companyName, iconURL: config.logo })
                .addFields(
                    { name: 'Original Ban Reason', value: banReason, inline: true }
                );
            await interaction.reply({ embeds: [embed] });
            const modLogsChannel = interaction.guild.channels.cache.get(config.logs);
            if (modLogsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('User Unbanned')
                    .setColor(config.embedColor)
                    .setThumbnail(config.logo)
                    .setFooter({ text: config.companyName, iconURL: config.logo })
                    .setTimestamp()
                    .addFields(
                        { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                        { name: 'Action', value: 'Unbanned', inline: true },
                        { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: 'Original Ban Reason', value: banReason, inline: true }
                    );

                await modLogsChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error('Error unbanning user:', error);
            return interaction.reply({ content: 'An error occurred while unbanning the user.', ephemeral: true });
        }
    },
};
