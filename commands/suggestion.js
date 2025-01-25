const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit a suggestion.')
        .addStringOption(option => 
            option.setName('suggestion')
                .setDescription('Your suggestion.')
                .setRequired(true)),
    async execute(interaction, client, config) {

        const suggestionText = interaction.options.getString('suggestion');
        const suggestionsChannel = client.channels.cache.get(config.suggestChannel);

        const embed = new EmbedBuilder()
            .setTitle('New Suggestion')
            .setColor(config.embedColor)
            .setDescription(suggestionText)
            .setFooter({ text: `Suggested by: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        const message = await suggestionsChannel.send({ embeds: [embed] });
        await message.react('👍');
        await message.react('👎');

        return interaction.reply({ content: 'Suggestion Successfully Sent!', ephemeral: true});

    },
};