require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

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
    try {
      const sent = await channel.send('⚙️ **System Diagnostics:** Testing bot connection and message transmission. If you see this, the bot is able to write to this channel!');
      console.log(`Successfully sent message. ID: ${sent.id}`);
    } catch (err) {
      console.error('Failed to send message:', err.message);
    }
  }
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
