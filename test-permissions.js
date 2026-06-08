require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error('Guild not found');
    process.exit(1);
  }
  
  const botMember = await guild.members.fetch(client.user.id);
  console.log(`Bot Member: ${botMember.user.tag}`);
  console.log(`Bot Roles: ${botMember.roles.cache.map(r => r.name).join(', ')}`);
  console.log(`Is Administrator: ${botMember.permissions.has('Administrator')}`);

  const channel = guild.channels.cache.find(c => c.name.includes('vidyasetu-issues'));
  if (!channel) {
    console.log('vidyasetu-issues channel not found!');
  } else {
    console.log(`Channel: ${channel.name} (${channel.id})`);
    console.log(`Parent: ${channel.parent?.name} (${channel.parentId})`);
    const permissions = channel.permissionsFor(botMember);
    console.log(`Bot permissions on channel:`);
    console.log(`- ViewChannel: ${permissions.has('ViewChannel')}`);
    console.log(`- SendMessages: ${permissions.has('SendMessages')}`);
    console.log(`- ReadMessageHistory: ${permissions.has('ReadMessageHistory')}`);
  }
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
