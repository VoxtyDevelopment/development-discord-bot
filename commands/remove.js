const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a user from the current ticket')
        .addUserOption(option => option.setName('user').setDescription('The user to remove').setRequired(true)),

    async execute(interaction) {
        if (!config.ticketChannelPrefixes.some(prefix => interaction.channel.name.startsWith(prefix))) {
            return interaction.reply({ content: 'This command can only be used in a ticket channel.', ephemeral: true });
        }

        const memberRoles = interaction.member.roles.cache;
        if (!(
            memberRoles.has(config.supportRole) ||
            memberRoles.has(config.devRole) ||
            memberRoles.has(config.adminRole) ||
            memberRoles.has(config.executiveRole)
        )) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) {
            return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
        }

        await interaction.channel.permissionOverwrites.delete(member);
        await interaction.reply({ content: `${user.tag} has been removed from this ticket.`, ephemeral: true });
        const modLogsChannel = interaction.guild.channels.cache.get(config.logs);
        if (modLogsChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('User Removed from Ticket')
                .setColor(config.embedColor)
                .setTimestamp()
                .setFooter({ text: config.companyName, iconURL: config.logo })
                .setThumbnail(config.logo)
                .addFields(
                    { name: 'User Removed', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Removed By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: 'Channel', value: `${interaction.channel.name} (${interaction.channel.id})`, inline: false }
                );

            await modLogsChannel.send({ embeds: [logEmbed] });
        }
    }
};
