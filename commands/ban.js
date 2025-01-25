const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user')
        .addUserOption(option => option.setName('user').setDescription('The user to ban').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for the ban')),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        let reason = interaction.options.getString('reason') || 'No reason provided';
        const memberRoles = interaction.member.roles.cache;
        if (!(memberRoles.has(config.adminRole) || memberRoles.has(config.executiveRole))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        if (user.id === interaction.user.id) {
            return interaction.reply({ content: 'You cannot ban yourself.', ephemeral: true });
        }
        const member = interaction.guild.members.cache.get(user.id);
        if (member && member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: 'You cannot ban a user with a higher or equal role to you.', ephemeral: true });
        }

        if (member && member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You cannot ban an administrator.', ephemeral: true });
        }
        if (reason.length > 1000) {
            return interaction.reply({ content: 'Reason cannot be longer than 1000 characters.', ephemeral: true });
        }
        try {
            await interaction.guild.members.ban(user, { reason });

            const embed = new EmbedBuilder()
                .setTitle('User Banned')
                .setDescription(`${user.tag} has been banned from the server.\nReason: ${reason}`)
                .setColor(config.embedColor)
                .setTimestamp()
                .setFooter({ text: config.companyName, iconURL: config.logoURL });

            await interaction.reply({ embeds: [embed] });
            const modLogsChannel = interaction.guild.channels.cache.get(config.modLogsChannelId);
            if (modLogsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('User Banned')
                    .setColor(config.embedColor)
                    .setThumbnail(config.logoURL)
                    .setFooter({ text: config.companyName, iconURL: config.logoURL })
                    .setTimestamp()
                    .addFields(
                        { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                        { name: 'Reason', value: reason, inline: true },
                        { name: 'Banned By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: 'Banned At', value: new Date().toLocaleString(), inline: true },
                    );

                await modLogsChannel.send({ embeds: [logEmbed] });
            }
        } catch (error) {
            console.error('Error banning user:', error);
            return interaction.reply({ content: 'An error occurred while banning the user.', ephemeral: true });
        }
    },
};
