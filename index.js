const { Client, Collection, GatewayIntentBits, EmbedBuilder, ComponentType, PermissionsBitField, Partials, Events, ActionRowBuilder, MessageActionRow, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, MessageSelectMenu, ButtonBuilder, ButtonStyle, ModalBuilder } = require('discord.js');
const config = require('./config');
const path = require("path");
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages]});
global.config = config;
const {deploy} = require("./utilities/core/deploy-commands");

deploy()

client.commands = new Collection();

const commandPath = path.join(__dirname, './commands');
const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

for(const file of commandFiles) {
    const filePath = path.join(commandPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property`)
    }
}


client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isChatInputCommand()) return;
    
    const command = interaction.client.commands.get(interaction.commandName);

    if(!command) {
        console.error(`No command matching ${interaction.commandName} was found.`)
        return;
    }

    try{
        await command.execute(interaction, client, config);
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: "there was an error while executing this command!", ephemeral: true})
    }
})

const eventFiles = fs.readdirSync(path.join(__dirname, './events')).filter(file => file.endsWith('.js'));
for(const file of eventFiles) {
    const filePath = `./events/${file}`
    const event = require(filePath)
    if(event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.once('ready', async () => {
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) {
        return;
    }

    const ticketChannel = guild.channels.cache.get(config.ticketChannelId);
    if (!ticketChannel) {
        return;
    }

    try {
        const messages = await ticketChannel.messages.fetch({ limit: 1 });
        const lastMessage = messages.first();

        if (lastMessage && lastMessage.author.id === client.user.id && lastMessage.embeds.length > 0) {
            await lastMessage.delete();
        }

        const embed = new EmbedBuilder()
            .setTitle('Open a Ticket')
            .setDescription('Click the buttons below to create a ticket.')
            .setColor(config.embedColor)
            .setThumbnail(config.logo)
            .setFooter({ text: config.companyName, iconURL: config.logo });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('support_ticket')
                    .setLabel('Support Ticket')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('purchase_product_ticket')
                    .setLabel('Purchase Product')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('order_commission_ticket')
                    .setLabel('Order a Commission')
                    .setStyle(ButtonStyle.Primary)
            );

        const message = await ticketChannel.send({ embeds: [embed], components: [buttons] });

        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button });

        collector.on('collect', async i => {
            let channelName;
            let existingChannel;

            if (i.customId === 'support_ticket') {
                channelName = `support-${i.user.username}`;
                existingChannel = guild.channels.cache.find(c => c.name === channelName && c.parentId === config.ticketCategoryId);
            }

            if (i.customId === 'purchase_product_ticket') {
                channelName = `purchase-${i.user.username}`;
                existingChannel = guild.channels.cache.find(c => c.name === channelName && c.parentId === config.ticketCategoryId);
            }

            if (i.customId === 'order_commission_ticket') {
                channelName = `commission-${i.user.username}`;
                existingChannel = guild.channels.cache.find(c => c.name === channelName && c.parentId === config.ticketCategoryId);
            }

            if (existingChannel) {
                return i.reply({ content: 'You already have an open ticket.', ephemeral: true });
            }

            const permissionOverwrites = [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: i.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                },
                {
                    id: config.executiveRole,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                },
                {
                    id: config.supportRole,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                },
                {
                    id: config.devRole,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                },
                {
                    id: config.adminRole,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                }
            ];

            const channel = await guild.channels.create({
                name: channelName,
                type: 0, 
                parent: config.ticketCategoryId,
                permissionOverwrites: permissionOverwrites
            });

            let welcomeMessage = `Welcome ${i.user}, please describe your issue or question. A staff member will assist you shortly.`;
            if (i.customId === 'purchase_product_ticket') {
                welcomeMessage = `Welcome ${i.user}, please provide details about the product you wish to purchase. A staff member will assist you shortly.`;
            } else if (i.customId === 'order_commission_ticket') {
                welcomeMessage = `Welcome ${i.user}, please provide details regarding the commission order. A staff member will assist you shortly.`;
            }

            await channel.send(welcomeMessage);
            await i.reply({ content: 'Your ticket has been created.', ephemeral: true });

            const modLogsChannel = guild.channels.cache.get(config.logs);
            if (modLogsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Ticket Created')
                    .setColor(config.embedColor)
                    .setThumbnail(config.logo)
                    .setFooter({ text: config.companyName, iconURL: config.logo })
                    .setTimestamp()
                    .addFields(
                        { name: 'User', value: `${i.user.tag} (${i.user.id})`, inline: true },
                        { name: 'Ticket Channel', value: `${channel.name} (${channel.id})`, inline: true },
                        { name: 'Ticket Type', value: i.customId === 'support_ticket' ? 'Support' : i.customId === 'purchase_product_ticket' ? 'Purchase Product' : 'Order Commission', inline: true }
                    );

                await modLogsChannel.send({ embeds: [logEmbed] });
            }
        });

        collector.on('end', () => {
        });
    } catch (error) {
        console.error('Error handling ticket creation:', error);
    }
});

client.login(config.token);