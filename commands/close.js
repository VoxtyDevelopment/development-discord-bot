const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close the current ticket'),

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

        await interaction.reply({ content: 'Closing the ticket...', ephemeral: true });

        try {
            const transcript = await discordTranscripts.createTranscript(interaction.channel);
            const modLogsChannel = interaction.guild.channels.cache.get(config.logs);
            if (modLogsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Ticket Closed')
                    .setColor(config.embedColor)
                    .setFooter({ text: config.companyName, iconURL: config.logo })
                    .setThumbnail(config.logo)
                    .setTimestamp()
                    .addFields(
                        { name: 'Ticket Name', value: `${interaction.channel.name}`, inline: true },
                        { name: 'Closed By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true }
                    );
                await modLogsChannel.send({
                    embeds: [logEmbed],
                    files: [transcript],
                    content: `Transcript for ticket **${interaction.channel.name}**:`
                });
            }
        } catch (error) {
            console.error('Error creating or sending transcript:', error);
            return interaction.followUp({ content: 'An error occurred while generating or sending the transcript.', ephemeral: true });
        }

        try {
            await interaction.channel.delete();
        } catch (error) {
            console.error('Error deleting ticket channel:', error);
            return interaction.followUp({ content: 'Failed to delete the ticket channel.', ephemeral: true });
        }
    }
};
