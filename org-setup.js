require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const COLORS = {
  vidyasetu: '#6C5CE7',      // Purple
  urlShortener: '#3498DB',   // Blue
  discordBot: '#1ABC9C',     // Green
  newcomer: '#2ECC71',       // Fresh Green
  primary: '#5865F2',        // Blurple
  warning: '#FEE75C',        // Yellow
};

const PROJECT_ROLES = [
  { name: '🌉 VidyaSetu', color: COLORS.vidyasetu },
  { name: '🌱 New Contributor', color: COLORS.newcomer },
];

client.once('ready', async () => {
  console.log(`\n✅ Logged in as ${client.user.tag}\n`);

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error('❌ Could not find the server! Make sure GUILD_ID is correct in .env');
    process.exit(1);
  }

  console.log(`📡 Restructuring server: ${guild.name} to Organization-Wide format...\n`);

  // ── 1. Create Roles ──
  console.log('━━━ Creating Organization & Project Roles ━━━');
  const roles = {};
  for (const roleConf of PROJECT_ROLES) {
    try {
      let existing = guild.roles.cache.find(r => r.name === roleConf.name);
      if (!existing) {
        existing = await guild.roles.create({
          name: roleConf.name,
          color: roleConf.color,
          hoist: true,
          reason: 'Organization restructuring',
        });
        console.log(`  ✅ Created role: ${roleConf.name}`);
      } else {
        console.log(`  ⏭️  Role already exists: ${roleConf.name}`);
      }
      roles[roleConf.name] = existing;
    } catch (err) {
      console.error(`  ❌ Failed to create/find role ${roleConf.name}:`, err.message);
    }
  }

  // ── 2. Create General Information Category ──
  console.log('\n━━━ Creating Info Category ━━━');
  let infoCategory = guild.channels.cache.find(
    c => c.name === '📢 INFORMATION' && c.type === ChannelType.GuildCategory
  );
  if (!infoCategory) {
    infoCategory = await guild.channels.create({
      name: '📢 INFORMATION',
      type: ChannelType.GuildCategory,
    });
    console.log('  📁 Created category: 📢 INFORMATION');
  }

  // Create Onboarding pick-your-project channel
  let pickProjectChannel = guild.channels.cache.find(
    c => c.name === 'pick-your-project' && c.parentId === infoCategory.id
  );
  if (!pickProjectChannel) {
    pickProjectChannel = await guild.channels.create({
      name: 'pick-your-project',
      type: ChannelType.GuildText,
      parent: infoCategory.id,
      topic: 'React to pick the projects you want to contribute to.',
    });
    console.log('  ✅ Created channel: #pick-your-project');
  }

  // Delete old pick-your-role channel if it exists
  const oldRoleChannel = guild.channels.cache.find(c => c.name === 'pick-your-role');
  if (oldRoleChannel) {
    try {
      await oldRoleChannel.delete('Restructuring to project selection');
      console.log('  🗑️  Deleted old #pick-your-role channel');
    } catch (err) {
      console.log(`  ⚠️  Failed to delete #pick-your-role: ${err.message}`);
    }
  }

  // ── 2b. Clean up legacy global categories/channels ──
  console.log('\n━━━ Cleaning Legacy Categories ━━━');
  const legacyCategories = ['💻 DEVELOPMENT', '🔄 GITHUB'];
  for (const catName of legacyCategories) {
    const cat = guild.channels.cache.find(
      c => c.name === catName && c.type === ChannelType.GuildCategory
    );
    if (cat) {
      try {
        // Delete all child channels first
        const children = guild.channels.cache.filter(c => c.parentId === cat.id);
        for (const child of children.values()) {
          await child.delete('Removing legacy global channel');
          console.log(`  🗑️  Deleted legacy channel: #${child.name}`);
        }
        await cat.delete('Removing legacy global category');
        console.log(`  🗑️  Deleted legacy category: ${catName}`);
      } catch (err) {
        console.log(`  ⚠️  Failed to delete legacy category ${catName}: ${err.message}`);
      }
    }
  }

  // ── 3. Create Private Project Categories & Channels ──
  console.log('\n━━━ Creating Private Project Categories ━━━');
  const projectConfigs = [
    {
      categoryName: '📐 VIDYASETU',
      roleName: '🌉 VidyaSetu',
      channels: [
        { name: 'vidyasetu-general', topic: 'General chats for the VidyaSetu project' },
        { name: 'vidyasetu-dev', topic: 'Development, ideas, and setup for VidyaSetu' },
        { name: 'vidyasetu-issues', topic: 'Live issues and contribution tasks' },
        { name: 'vidyasetu-prs', topic: 'PR alerts and reviews' },
      ],
    },
  ];

  for (const proj of projectConfigs) {
    const projectRole = roles[proj.roleName];
    if (!projectRole) continue;

    // Check/Create private category
    let cat = guild.channels.cache.find(
      c => c.name === proj.categoryName && c.type === ChannelType.GuildCategory
    );
    if (!cat) {
      cat = await guild.channels.create({
        name: proj.categoryName,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: projectRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
        ],
      });
      console.log(`  📁 Created private category: ${proj.categoryName}`);
    } else {
      console.log(`  ⏭️  Category exists: ${proj.categoryName}`);
      // Update permissions to ensure it's private
      await cat.permissionOverwrites.set([
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: projectRole.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
      ]);
    }

    // Create channels
    for (const ch of proj.channels) {
      const existing = guild.channels.cache.find(
        c => c.name === ch.name && c.parentId === cat.id
      );
      if (!existing) {
        await guild.channels.create({
          name: ch.name,
          type: ChannelType.GuildText,
          parent: cat.id,
          topic: ch.topic,
        });
        console.log(`    ✅ Created channel: #${ch.name}`);
      } else {
        console.log(`    ⏭️  Channel exists: #${ch.name}`);
      }
    }
  }

  // ── 4. Send Onboarding Pick-Your-Project Embed ──
  console.log('\n━━━ Sending Onboarding Project Picker Embed ━━━');
  if (pickProjectChannel) {
    const embed = new EmbedBuilder()
      .setTitle('🌉 Select Your Contribution Projects')
      .setDescription(
        'Welcome to the organization! React to this message to reveal and join the channels for the project you want to contribute to:\n\n' +
        '🌉 — **VidyaSetu** (AI-powered NCERT adaptive study and assessment platform)\n\n' +
        '*You can choose to join or leave the project at any time!*'
      )
      .setColor(COLORS.primary)
      .setFooter({ text: 'React below to reveal VidyaSetu project categories!' });

    try {
      // Clear old messages in pick-your-project channel first
      const messages = await pickProjectChannel.messages.fetch({ limit: 10 });
      for (const msg of messages.values()) {
        await msg.delete();
      }

      const msg = await pickProjectChannel.send({ embeds: [embed] });
      await msg.react('🌉');
      console.log('  ✅ Project Picker Embed sent with reactions!');
    } catch (err) {
      console.error('  ❌ Failed to send picker embed:', err.message);
    }
  }

  console.log('\n🎉 Restructuring complete!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
