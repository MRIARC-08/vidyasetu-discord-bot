require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error('Guild not found');
    process.exit(1);
  }
  
  console.log(`\nServer Name: ${guild.name}`);
  
  // Fetch channels to make sure cache is populated
  const channels = await guild.channels.fetch();
  
  // Group by category
  const categories = channels.filter(c => c.type === ChannelType.GuildCategory).sort((a, b) => a.rawPosition - b.rawPosition);
  const orphanChannels = channels.filter(c => !c.parentId && c.type !== ChannelType.GuildCategory).sort((a, b) => a.rawPosition - b.rawPosition);

  console.log('\n--- Orphan Channels (No Category) ---');
  orphanChannels.forEach(c => {
    console.log(`- #${c.name} (${c.type})`);
  });

  for (const cat of categories.values()) {
    console.log(`\n📁 Category: ${cat.name}`);
    const catChannels = channels.filter(c => c.parentId === cat.id).sort((a, b) => a.rawPosition - b.rawPosition);
    catChannels.forEach(c => {
      console.log(`  - #${c.name} (${c.type === ChannelType.GuildVoice ? 'Voice' : 'Text'})`);
    });
  }
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
