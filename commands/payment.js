const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('payment')
        .setDescription('Provides payment information and Terms of Service link'),
    async execute(interaction) {
        const target = interaction.options.getUser('user') ?? interaction.user;

        const paymentEmbed = new EmbedBuilder()
            .setTitle('Payment Information')
            .setDescription(`**There are to be no chargebacks (refund request) once you have paid for the asset you have purchased. If you try to do a chargeback, you will be banned from the ${config.companyName} server, and a claim will be submitted with Paypal or Cashapp to deny chargeback for following the purchasing and selling digital products policy.**\n\n**Paypal Payment**\n\nIf you are looking to pay with paypal please send the money as friends and family to ${config.paypal} for the price of the product. Put the purchase description of "Buying a Digital Asset from ${config.companyName}"\n\n**Cashapp Payment**\n\nIf you are looking to pay with cashapp please send the money to ${config.cashAppID} (name ${config.cashAppName}) for the price of the product and place the payment description of "buying a digital asset from ${config.companyName}."`)
            .setColor(config.embedColor)
            .addFields(
                { name: 'TOS', value: `[Terms of Service](${config.tosLink})` }
            )
            .setThumbnail(config.logo)
            .setFooter({ text: target.tag, iconURL: config.logo })
            .setTimestamp();

        await interaction.reply({ embeds: [paymentEmbed] });
    },
};
