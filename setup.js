require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ═══════════════════════════════════════════════════
// 🎨 COLOR PALETTE
// ═══════════════════════════════════════════════════
const COLORS = {
  primary: '#5865F2',    // Discord Blurple
  success: '#57F287',    // Green
  warning: '#FEE75C',    // Yellow
  danger: '#ED4245',     // Red
  info: '#5BC0EB',       // Light Blue
  maintainer: '#E91E63', // Pink
  contributor: '#9B59B6', // Purple
  newcomer: '#2ECC71',   // Fresh Green
};

// ═══════════════════════════════════════════════════
// 🏷️ ROLES CONFIGURATION
// ═══════════════════════════════════════════════════
const ROLES = [
  { name: '🛡️ Admin',          color: COLORS.danger,      hoist: true, position: 10, permissions: [PermissionFlagsBits.Administrator] },
  { name: '🔧 Maintainer',     color: COLORS.maintainer,  hoist: true, position: 9 },
  { name: '⭐ Core Contributor', color: COLORS.primary,    hoist: true, position: 8 },
  { name: '💻 Contributor',     color: COLORS.contributor, hoist: true, position: 7 },
  { name: '🌱 New Contributor', color: COLORS.newcomer,    hoist: true, position: 6 },
  { name: '🎨 Frontend',       color: '#E67E22',          hoist: false, position: 5 },
  { name: '⚙️ Backend',         color: '#3498DB',          hoist: false, position: 4 },
  { name: '📱 Mobile',          color: '#1ABC9C',          hoist: false, position: 3 },
  { name: '📝 Docs',            color: '#95A5A6',          hoist: false, position: 2 },
  { name: '🤖 Bot',             color: '#99AAB5',          hoist: false, position: 1 },
];

// ═══════════════════════════════════════════════════
// 📁 CHANNEL CONFIGURATION
// ═══════════════════════════════════════════════════
const CATEGORIES = [
  {
    name: '📢 INFORMATION',
    channels: [
      { name: 'welcome',        type: ChannelType.GuildText, topic: 'Welcome to Vidyasetu! Read the rules and get started.' },
      { name: 'rules',          type: ChannelType.GuildText, topic: 'Server rules and guidelines for contributors.' },
      { name: 'announcements',  type: ChannelType.GuildText, topic: 'Project announcements and updates.' },
      { name: 'pick-your-role', type: ChannelType.GuildText, topic: 'React to pick your contributor roles.' },
    ]
  },
  {
    name: '💬 COMMUNITY',
    channels: [
      { name: 'general',        type: ChannelType.GuildText, topic: 'General discussion about Vidyasetu.' },
      { name: 'introductions',  type: ChannelType.GuildText, topic: 'Introduce yourself to the community!' },
      { name: 'ideas',          type: ChannelType.GuildText, topic: 'Share your ideas for Vidyasetu.' },
      { name: 'showcase',       type: ChannelType.GuildText, topic: 'Show off what you\'ve built or contributed.' },
      { name: 'off-topic',      type: ChannelType.GuildText, topic: 'Anything goes — just keep it friendly.' },
    ]
  },
  {
    name: '💻 DEVELOPMENT',
    channels: [
      { name: 'dev-general',      type: ChannelType.GuildText, topic: 'General development discussion.' },
      { name: 'frontend',         type: ChannelType.GuildText, topic: 'Frontend (React, Next.js, CSS) discussions.' },
      { name: 'backend',          type: ChannelType.GuildText, topic: 'Backend (APIs, databases, server) discussions.' },
      { name: 'mobile',           type: ChannelType.GuildText, topic: 'Mobile app development discussions.' },
      { name: 'dev-help',         type: ChannelType.GuildText, topic: 'Ask for help with development issues.' },
      { name: 'code-review',      type: ChannelType.GuildText, topic: 'Request and share code reviews.' },
    ]
  },
  {
    name: '🔄 GITHUB',
    channels: [
      { name: 'pull-requests',   type: ChannelType.GuildText, topic: 'Discuss pull requests and get reviews.' },
      { name: 'issues',          type: ChannelType.GuildText, topic: 'Discuss GitHub issues and bugs.' },
      { name: 'good-first-issues', type: ChannelType.GuildText, topic: 'Good first issues for new contributors.' },
      { name: 'releases',        type: ChannelType.GuildText, topic: 'Release notes and version updates.' },
    ]
  },
  {
    name: '📚 RESOURCES',
    channels: [
      { name: 'getting-started', type: ChannelType.GuildText, topic: 'Setup guides and contribution workflows.' },
      { name: 'documentation',   type: ChannelType.GuildText, topic: 'Docs, tutorials, and references.' },
      { name: 'tools-and-setup', type: ChannelType.GuildText, topic: 'Dev tools, IDE configs, and environment setup.' },
    ]
  },
  {
    name: '🎙️ VOICE',
    channels: [
      { name: 'Pair Programming', type: ChannelType.GuildVoice },
      { name: 'Team Meeting',     type: ChannelType.GuildVoice },
      { name: 'Hangout',          type: ChannelType.GuildVoice },
    ]
  },
];

// ═══════════════════════════════════════════════════
// 🚀 SETUP FUNCTION
// ═══════════════════════════════════════════════════
client.once('ready', async () => {
  console.log(`\n✅ Logged in as ${client.user.tag}\n`);

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error('❌ Could not find the server! Make sure GUILD_ID is correct in .env');
    console.log('Your servers:', client.guilds.cache.map(g => `${g.name} (${g.id})`).join(', '));
    process.exit(1);
  }

  console.log(`📡 Setting up server: ${guild.name}\n`);

  // ── Step 1: Create Roles ──
  console.log('━━━ Creating Roles ━━━');
  const createdRoles = {};
  for (const roleConfig of ROLES) {
    try {
      const existing = guild.roles.cache.find(r => r.name === roleConfig.name);
      if (existing) {
        console.log(`  ⏭️  Role already exists: ${roleConfig.name}`);
        createdRoles[roleConfig.name] = existing;
        continue;
      }
      const role = await guild.roles.create({
        name: roleConfig.name,
        color: roleConfig.color,
        hoist: roleConfig.hoist,
        reason: 'Vidyasetu server setup',
        permissions: roleConfig.permissions || [],
      });
      createdRoles[roleConfig.name] = role;
      console.log(`  ✅ Created role: ${roleConfig.name}`);
    } catch (err) {
      console.error(`  ❌ Failed to create role ${roleConfig.name}:`, err.message);
    }
  }

  // ── Step 2: Delete default channels ──
  console.log('\n━━━ Cleaning Default Channels ━━━');
  for (const channel of guild.channels.cache.values()) {
    if (['general', 'General'].includes(channel.name) && channel.type === ChannelType.GuildText) {
      try {
        await channel.delete('Vidyasetu setup — replacing defaults');
        console.log(`  🗑️  Deleted default channel: #${channel.name}`);
      } catch (err) {
        console.log(`  ⚠️  Could not delete #${channel.name}: ${err.message}`);
      }
    }
  }

  // ── Step 3: Create Categories & Channels ──
  console.log('\n━━━ Creating Channels ━━━');
  for (const category of CATEGORIES) {
    try {
      // Check if category already exists
      let cat = guild.channels.cache.find(
        c => c.name === category.name && c.type === ChannelType.GuildCategory
      );
      if (!cat) {
        cat = await guild.channels.create({
          name: category.name,
          type: ChannelType.GuildCategory,
          reason: 'Vidyasetu server setup',
        });
        console.log(`  📁 Created category: ${category.name}`);
      } else {
        console.log(`  ⏭️  Category exists: ${category.name}`);
      }

      for (const ch of category.channels) {
        const existing = guild.channels.cache.find(
          c => c.name === ch.name.toLowerCase().replace(/ /g, '-') && c.parentId === cat.id
        );
        if (existing) {
          console.log(`    ⏭️  Channel exists: #${ch.name}`);
          continue;
        }
        await guild.channels.create({
          name: ch.name,
          type: ch.type,
          parent: cat.id,
          topic: ch.topic || null,
          reason: 'Vidyasetu server setup',
        });
        console.log(`    ✅ Created channel: ${ch.type === ChannelType.GuildVoice ? '🔊' : '#'}${ch.name}`);
      }
    } catch (err) {
      console.error(`  ❌ Error in category ${category.name}:`, err.message);
    }
  }

  // ── Step 4: Send Welcome Embed ──
  console.log('\n━━━ Setting Up Welcome Message ━━━');
  const welcomeChannel = guild.channels.cache.find(c => c.name === 'welcome');
  if (welcomeChannel) {
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('🌉 Welcome to Vidyasetu Open Source Community!')
      .setDescription(
        `**Vidyasetu** — *Bridging the knowledge gap through open source.*\n\n` +
        `We're building an educational platform that makes quality education accessible to everyone. ` +
        `Whether you're a seasoned developer or just starting your open source journey, there's a place for you here!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━`
      )
      .addFields(
        {
          name: '🚀 Getting Started',
          value: [
            '1️⃣ Read the <#rules> channel',
            '2️⃣ Introduce yourself in <#introductions>',
            '3️⃣ Pick your roles in <#pick-your-role>',
            '4️⃣ Check out <#getting-started> for setup guides',
            '5️⃣ Find something to work on in <#good-first-issues>',
          ].join('\n'),
        },
        {
          name: '🔗 Important Links',
          value: [
            '📦 [GitHub Repository](https://github.com/adarshchauhan/vidyasetu)',
            '📖 [Documentation](https://github.com/adarshchauhan/vidyasetu/docs)',
            '🐛 [Report a Bug](https://github.com/adarshchauhan/vidyasetu/issues/new)',
          ].join('\n'),
        },
        {
          name: '💡 How to Contribute',
          value: [
            '• Fork the repo and create a branch',
            '• Make your changes and test them',
            '• Submit a PR and request review',
            '• Discuss in <#pull-requests> if needed',
          ].join('\n'),
        }
      )
      .setColor(COLORS.primary)
      .setFooter({ text: 'Vidyasetu • Open Source Education Platform' })
      .setTimestamp();

    try {
      await welcomeChannel.send({ embeds: [welcomeEmbed] });
      console.log('  ✅ Welcome message sent!');
    } catch (err) {
      console.error('  ❌ Failed to send welcome message:', err.message);
    }
  }

  // ── Step 5: Send Rules Embed ──
  const rulesChannel = guild.channels.cache.find(c => c.name === 'rules');
  if (rulesChannel) {
    const rulesEmbed = new EmbedBuilder()
      .setTitle('📜 Community Rules & Guidelines')
      .setDescription('Please follow these rules to keep our community welcoming and productive.')
      .addFields(
        {
          name: '1️⃣ Be Respectful',
          value: 'Treat everyone with respect. No harassment, discrimination, or toxic behavior.',
        },
        {
          name: '2️⃣ Stay On Topic',
          value: 'Use the appropriate channels for discussions. Keep dev talk in dev channels.',
        },
        {
          name: '3️⃣ No Spam',
          value: 'No spam, self-promotion, or advertising without permission.',
        },
        {
          name: '4️⃣ Code of Conduct',
          value: 'Follow our [Code of Conduct](https://github.com/adarshchauhan/vidyasetu/blob/main/CODE_OF_CONDUCT.md). Be inclusive and collaborative.',
        },
        {
          name: '5️⃣ Ask Smart Questions',
          value: 'When asking for help, provide context: what you tried, error messages, and relevant code.',
        },
        {
          name: '6️⃣ Give Credit',
          value: 'Respect intellectual property. Credit others\' work and contributions.',
        },
        {
          name: '7️⃣ Have Fun!',
          value: 'Open source is about community. Enjoy the journey and help others along the way! 🎉',
        },
      )
      .setColor(COLORS.warning)
      .setFooter({ text: 'Breaking rules may result in warnings, mutes, or bans.' });

    try {
      await rulesChannel.send({ embeds: [rulesEmbed] });
      console.log('  ✅ Rules message sent!');
    } catch (err) {
      console.error('  ❌ Failed to send rules message:', err.message);
    }
  }

  // ── Step 6: Send Role Picker Embed ──
  const roleChannel = guild.channels.cache.find(c => c.name === 'pick-your-role');
  if (roleChannel) {
    const roleEmbed = new EmbedBuilder()
      .setTitle('🎭 Pick Your Roles')
      .setDescription(
        'React to this message to assign yourself roles!\n\n' +
        '🎨 — **Frontend** (React, Next.js, CSS, UI/UX)\n' +
        '⚙️ — **Backend** (APIs, Node.js, Databases)\n' +
        '📱 — **Mobile** (React Native, Flutter, iOS/Android)\n' +
        '📝 — **Docs** (Documentation, Tutorials, Guides)\n'
      )
      .setColor(COLORS.info)
      .setFooter({ text: 'React below to get your roles!' });

    try {
      const roleMsg = await roleChannel.send({ embeds: [roleEmbed] });
      await roleMsg.react('🎨');
      await roleMsg.react('⚙️');
      await roleMsg.react('📱');
      await roleMsg.react('📝');
      console.log('  ✅ Role picker message sent with reactions!');
    } catch (err) {
      console.error('  ❌ Failed to send role picker:', err.message);
    }
  }

  // ── Step 7: Send Getting Started Guide ──
  const gettingStartedChannel = guild.channels.cache.find(c => c.name === 'getting-started');
  if (gettingStartedChannel) {
    const guideEmbed = new EmbedBuilder()
      .setTitle('🗺️ Getting Started with Vidyasetu Development')
      .setDescription('Everything you need to start contributing to Vidyasetu.')
      .addFields(
        {
          name: '📋 Prerequisites',
          value: '• Node.js (v18+)\n• Git\n• A GitHub account\n• Your favorite code editor',
        },
        {
          name: '🔧 Setup Steps',
          value: [
            '```bash',
            '# 1. Fork the repo on GitHub',
            '# 2. Clone your fork',
            'git clone https://github.com/YOUR_USERNAME/vidyasetu.git',
            '',
            '# 3. Install dependencies',
            'cd vidyasetu && npm install',
            '',
            '# 4. Create a branch',
            'git checkout -b feature/your-feature-name',
            '',
            '# 5. Start developing!',
            'npm run dev',
            '```',
          ].join('\n'),
        },
        {
          name: '📨 Submitting Your Work',
          value: '1. Commit your changes with clear messages\n2. Push to your fork\n3. Open a Pull Request\n4. Request review in <#pull-requests>',
        },
      )
      .setColor(COLORS.success)
      .setFooter({ text: 'Need help? Ask in #dev-help!' });

    try {
      await gettingStartedChannel.send({ embeds: [guideEmbed] });
      console.log('  ✅ Getting started guide sent!');
    } catch (err) {
      console.error('  ❌ Failed to send getting started guide:', err.message);
    }
  }

  console.log('\n🎉 ══════════════════════════════════════');
  console.log('   Server setup complete!');
  console.log('   Now run: npm start');
  console.log('   to keep the bot running.');
  console.log('══════════════════════════════════════════\n');

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
