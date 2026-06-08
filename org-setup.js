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
      const existing = guild.channels.cache.find(c => {
        const baseName = c.name.replace(/[^a-zA-Z0-9-]/g, '').trim().toLowerCase();
        return (c.name === ch.name || baseName === ch.name.toLowerCase()) && c.parentId === cat.id;
      });
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

  // ── 3b. Restrict legacy project categories to VidyaSetu role ──
  console.log('\n━━━ Merging Legacy Categories into VIDYASETU Category ━━━');
  const targetCategory = guild.channels.cache.find(
    c => c.name === '📐 VIDYASETU' && c.type === ChannelType.GuildCategory
  );
  
  if (targetCategory) {
    const channelsToMove = [
      // GSSoC Channels
      'gssoc-announcements', 'gssoc-leaderboard', 'claim-issues', 'pr-reviews', 'doubts',
      // Project Info Channels
      'tech-stack', 'architecture', 'ui-ux-design', 'ai-ml-features', 'deployment'
    ];

    for (const name of channelsToMove) {
      // Find channel by name (with or without emoji prefix)
      const ch = guild.channels.cache.find(c => {
        const baseName = c.name.replace(/[^a-zA-Z0-9-]/g, '').trim().toLowerCase();
        return c.name === name || baseName === name;
      });

      if (ch) {
        try {
          await ch.setParent(targetCategory.id);
          await ch.lockPermissions();
          console.log(`  📦 Moved & Locked channel: #${ch.name} -> 📐 VIDYASETU`);
        } catch (err) {
          console.log(`  ⚠️  Failed to move channel #${name}: ${err.message}`);
        }
      }
    }

    // Now delete GSSOC and PROJECT categories
    const categoriesToDelete = ['🏆 GSSOC 2026', '📐 PROJECT'];
    for (const catName of categoriesToDelete) {
      const cat = guild.channels.cache.find(
        c => c.name === catName && c.type === ChannelType.GuildCategory
      );
      if (cat) {
        try {
          await cat.delete('Merged categories');
          console.log(`  🗑️  Deleted empty legacy category: ${catName}`);
        } catch (err) {
          console.log(`  ⚠️  Failed to delete category ${catName}: ${err.message}`);
        }
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

  // ── 5. Add Emojis to Channels ──
  console.log('\n━━━ Adding Emojis to Channels ━━━');
  const EMOJI_MAPPING = {
    'welcome': '👋welcome',
    'rules': '📜rules',
    'pick-your-project': '🎭pick-your-project',
    'announcements': '📢announcements',
    'general': '💬general',
    'introductions': '🤝introductions',
    'ideas': '💡ideas',
    'showcase': '✨showcase',
    'off-topic': '🎳off-topic',
    'getting-started': '🏁getting-started',
    'documentation': '📖documentation',
    'tools-and-setup': '🛠️tools-and-setup',
    'vidyasetu-general': '💬vidyasetu-general',
    'vidyasetu-dev': '💻vidyasetu-dev',
    'vidyasetu-issues': '📋vidyasetu-issues',
    'vidyasetu-prs': '🔀vidyasetu-prs',
    'gssoc-announcements': '📢gssoc-announcements',
    'gssoc-leaderboard': '📊gssoc-leaderboard',
    'claim-issues': '🎯claim-issues',
    'pr-reviews': '🔍pr-reviews',
    'doubts': '❓doubts',
    'tech-stack': '⚡tech-stack',
    'architecture': '🏗️architecture',
    'ui-ux-design': '🎨ui-ux-design',
    'ai-ml-features': '🧠ai-ml-features',
    'deployment': '🚀deployment',
    'bot-documentation': '🤖bot-documentation',
    'Pair Programming': '💻 Pair Programming',
    'Team Meeting': '📅 Team Meeting',
    'Hangout': '☕ Hangout'
  };

  for (const channel of guild.channels.cache.values()) {
    if (channel.type === ChannelType.GuildCategory) continue;
    const baseName = channel.name.replace(/[^a-zA-Z0-9- ]/g, '').trim().toLowerCase();
    let newName = EMOJI_MAPPING[channel.name] || EMOJI_MAPPING[baseName];
    if (newName && channel.name !== newName) {
      try {
        await channel.setName(newName);
        console.log(`  🏷️  Renamed: #${channel.name} -> #${newName}`);
      } catch (err) {
        console.log(`  ⚠️  Failed to rename #${channel.name}: ${err.message}`);
      }
    }
  }

  // ── 6. Create Admin Category & Bot Documentation ──
  console.log('\n━━━ Creating Admin Category & Bot Documentation ━━━');
  const adminRole = guild.roles.cache.find(r => r.name === '🛡️ Admin');
  
  let adminCategory = guild.channels.cache.find(
    c => c.name === '🛡️ ADMIN' && c.type === ChannelType.GuildCategory
  );
  if (!adminCategory) {
    const overwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      }
    ];
    if (adminRole) {
      overwrites.push({
        id: adminRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      });
    }
    adminCategory = await guild.channels.create({
      name: '🛡️ ADMIN',
      type: ChannelType.GuildCategory,
      permissionOverwrites: overwrites,
    });
    console.log('  🔒 Created private category: 🛡️ ADMIN');
  } else if (adminRole) {
    await adminCategory.permissionOverwrites.set([
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: adminRole.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
    ]);
  }

  let docChannel = guild.channels.cache.find(
    c => c.name === 'bot-documentation' || c.name === '🤖bot-documentation'
  );
  if (!docChannel) {
    docChannel = await guild.channels.create({
      name: 'bot-documentation',
      type: ChannelType.GuildText,
      parent: adminCategory.id,
      topic: 'Documentation for the VidyaSetu Discord bot configuration and architecture.',
    });
    await docChannel.setName('🤖bot-documentation');
    console.log('  ✅ Created channel: #bot-documentation');
  } else {
    // Ensure parent is correct
    await docChannel.setParent(adminCategory.id);
  }

  if (docChannel) {
    try {
      // Clear old messages first
      const messages = await docChannel.messages.fetch({ limit: 50 });
      for (const msg of messages.values()) {
        await msg.delete();
      }

      console.log('  📝 Sending bot documentation embeds...');

      // Embed 1: Operations Guide
      const opsEmbed = new EmbedBuilder()
        .setTitle('🤖 Bot Operations & Deploy Guide')
        .setDescription('High-level overview of the bot lifecycle and hosting on Render.')
        .addFields(
          { name: '🌐 Hosting Platform', value: 'Hosted on **Render** (as a Web Service) to ensure 24/7 availability.' },
          { name: '🔌 Health Check Server', value: 'The bot starts a local HTTP server on `process.env.PORT` (defaults to 10000 on Render). Pinging `/health` returns status metadata to keep the service awake.' },
          { name: '🔑 Environment Variables', value: [
            '`DISCORD_TOKEN` — Bot client auth credential.',
            '`GUILD_ID` — Target Discord guild (used for setup scripts).',
            '`GITHUB_TOKEN` — Personal Access Token to bypass GitHub API rate limits.'
          ].join('\n') },
          { name: '🚀 CI/CD Pipeline', value: 'Every git push to `master` branch on GitHub triggers an automatic redeploy on Render.' }
        )
        .setColor('#5865F2')
        .setTimestamp();

      // Embed 2: Architecture Guide
      const archEmbed = new EmbedBuilder()
        .setTitle('🏗️ Modular Bot Command Architecture')
        .setDescription('Overview of the proposed directory design for modular commands.')
        .addFields(
          { name: '📂 Directory Map', value: 'Commands are parsed dynamically from category folders (e.g. `/commands/general/`, `/commands/vidyasetu/`). Events reside in `/events/`.' },
          { name: '🔒 Project Role Gate', value: 'Command files can export a `projectRole` key (e.g. `projectRole: "🌉 VidyaSetu"`). The event handler blocks execution and replies with a prompt if the member lacks the role.' },
          { name: '📈 Adding New Projects', value: 'Simply drop new commands in `/commands/new-project/` and they will load dynamically. Core connection loops remain untouched.' }
        )
        .setColor('#6C5CE7')
        .setTimestamp();

      // Embed 3: Server Permissions Map
      const permissionsEmbed = new EmbedBuilder()
        .setTitle('🛡️ Server Restructuring & Visibility Map')
        .setDescription('How the category permissions are organized to keep project channels private.')
        .addFields(
          { name: '🌍 Global Categories', value: '`📢 INFORMATION`, `💬 COMMUNITY`, and `📚 RESOURCES` are visible to all members (role: `@everyone`).' },
          { name: '🔒 Project Categories', value: '`📐 VIDYASETU` denies view permission to `@everyone` and allows it only for the `🌉 VidyaSetu` project role. This category contains all private developer, design, and GSSoC discussion channels.' },
          { name: '🎭 Onboarding Flow', value: 'New members land on `#pick-your-project` and react with `🌉` to assign themselves the project role, immediately unlocking the `📐 VIDYASETU` category.' }
        )
        .setColor('#E91E63')
        .setTimestamp();

      // Embed 4: Feature Guide
      const featureEmbed = new EmbedBuilder()
        .setTitle('🤖 Bot Feature Guide & Command Reference')
        .setDescription('Detailed mapping of what the bot currently manages on the server.')
        .addFields(
          { name: '👋 Onboarding & Autoroles', value: 'Automatically assigns the `🌱 New Contributor` role when members join and sends a customized greeting embed in `#welcome`.' },
          { name: '🎭 Project Opt-In (Reaction Roles)', value: 'Watches `#pick-your-project` reactions. Assigning the `🌉 VidyaSetu` role reveals all GSSoC, tech-stack, and dev tracker channels instantly.' },
          { name: '📋 GitHub Integration Commands', value: [
            '`!issues` / `!issues <page_number>` — Browse open issues.',
            '`!issues search <query>` — Live regex/text search on repo issues.',
            '`!issues labels` — Dynamic fetch of all repository labels.',
            '`!issues #42` — View full details of specific issue #42.',
            '`!issues unassigned` / `!issues assigned <user>` — Quick issue filters.',
            '`!prs` / `!prs #42` — Track live pull requests and review status.'
          ].join('\n') },
          { name: '💬 General Info Commands', value: '`!repo` (git links), `!techstack` (stack guide), `!contribute` (onboarding instructions), `!ping` (ping test), `!stats` (live server members/channels statistics).' }
        )
        .setColor('#00B894')
        .setTimestamp();

      await docChannel.send({ embeds: [opsEmbed, archEmbed, permissionsEmbed, featureEmbed] });
      console.log('  ✅ Documentation embeds sent successfully!');
    } catch (err) {
      console.error('  ❌ Failed to populate bot documentation:', err.message);
    }
  }

  console.log('\n🎉 Restructuring complete!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
