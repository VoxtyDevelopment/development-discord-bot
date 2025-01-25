const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a user to the current ticket')
        .addUserOption(option => option.setName('user').setDescription('The user to add').setRequired(true)),

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
        try {
            await interaction.channel.permissionOverwrites.create(member, {
                ViewChannel: true,
                SendMessages: true,
            });
            await interaction.reply({ content: `${user.tag} has been added to this ticket.`, ephemeral: true });
            const modLogsChannel = interaction.guild.channels.cache.get(config.logs);
            if (modLogsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('User Added to Ticket')
                    .setColor(config.embedColor)
                    .setThumbnail(config.logo)
                    .setFooter({ text: config.companyName, iconURL: config.logo })
                    .setTimestamp()
                    .addFields(
                        { name: 'Ticket Channel', value: `${interaction.channel.name} (${interaction.channel.id})`, inline: true },
                        { name: 'Added User', value: `${user.tag} (${user.id})`, inline: true },
                        { name: 'Added By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true }
                    );

                await modLogsChannel.send({ embeds: [logEmbed] });
            }
        } catch (error) {
            console.error('Error adding user to ticket:', error);
            return interaction.reply({ content: 'Failed to add the user to the ticket. Please try again.', ephemeral: true });
        }
    }
};
