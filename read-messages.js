require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.once('ready', async () => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error('Guild not found');
    process.exit(1);
  }
  
  const channel = guild.channels.cache.find(c => c.name.includes('vidyasetu-issues'));
  if (!channel) {
    console.log('vidyasetu-issues channel not found!');
  } else {
    console.log(`Channel: ${channel.name} (${channel.id})`);
    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      console.log(`Fetched ${messages.size} messages:`);
      messages.reverse().forEach(m => {
        console.log(`- [${m.author.tag}]: "${m.content}" (Length: ${m.content.length})`);
      });
    } catch (err) {
      console.error('Failed to fetch messages:', err.message);
    }
  }
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
