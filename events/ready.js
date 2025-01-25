const { Client, ActivityType } = require('discord.js');

module.exports = {
  once: true,
  name: 'ready',
  async execute(client) {
    function getTotalMemberCount() {
      return client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
    }
    
    const activities = [
      { name: config.botstatus, type: ActivityType.Playing },
      { name: config.botstatus2, type: ActivityType.Playing },
      { name: config.botstatus3, type: ActivityType.Playing },
      { name: `${getTotalMemberCount()} members`, type: ActivityType.Watching },
    ];

    let i = 0;
    client.user.setPresence({
      status: config.status,
      activities: [activities[i % activities.length]],
    });

    setInterval(() => {
      i++;
      client.user.setPresence({
        status: config.status,
        activities: [activities[i % activities.length]],
      });
    }, config.statusUpdateInterval);
  },
};
