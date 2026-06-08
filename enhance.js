require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ═══════════════════════════════════════════════════
// 🎨 VIDYASETU BRAND COLORS
// ═══════════════════════════════════════════════════
const COLORS = {
  brand:       '#6C5CE7',  // VidyaSetu Purple
  gssoc:       '#FF6B6B',  // GSSoC Red
  nextjs:      '#000000',  // Next.js Black
  typescript:  '#3178C6',  // TypeScript Blue
  postgres:    '#336791',  // PostgreSQL Blue
  success:     '#00B894',  // Green
  gold:        '#FDCB6E',  // Gold
  info:        '#74B9FF',  // Light Blue
  react:       '#61DAFB',  // React Blue
  prisma:      '#2D3748',  // Prisma Dark
  tailwind:    '#06B6D4',  // Tailwind Cyan
};

client.once('ready', async () => {
  console.log(`\n✅ Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error('❌ Server not found!');
    process.exit(1);
  }

  console.log(`\n🎨 Enhancing VidyaSetu Discord with project-specific content...\n`);

  // ── 1. Add GSSoC-specific roles ──
  console.log('━━━ Adding GSSoC Roles ━━━');
  const gssocRoles = [
    { name: '🏆 GSSoC Contributor', color: COLORS.gssoc,   hoist: true },
    { name: '📊 Level 1',           color: '#95A5A6',       hoist: false },
    { name: '📊 Level 2',           color: '#3498DB',       hoist: false },
    { name: '📊 Level 3',           color: '#E91E63',       hoist: false },
    { name: '🔥 Top Contributor',   color: COLORS.gold,     hoist: true },
  ];

  for (const roleConfig of gssocRoles) {
    const existing = guild.roles.cache.find(r => r.name === roleConfig.name);
    if (existing) {
      console.log(`  ⏭️  Role exists: ${roleConfig.name}`);
      continue;
    }
    try {
      await guild.roles.create({
        name: roleConfig.name,
        color: roleConfig.color,
        hoist: roleConfig.hoist,
        reason: 'VidyaSetu GSSoC enhancement',
      });
      console.log(`  ✅ Created role: ${roleConfig.name}`);
    } catch (err) {
      console.error(`  ❌ ${roleConfig.name}: ${err.message}`);
    }
  }

  // ── 2. Add GSSoC & Project-specific channels ──
  console.log('\n━━━ Adding Project Channels ━━━');

  // Find or create GSSoC category
  let gssocCat = guild.channels.cache.find(
    c => c.name === '🏆 GSSOC 2026' && c.type === ChannelType.GuildCategory
  );
  if (!gssocCat) {
    gssocCat = await guild.channels.create({
      name: '🏆 GSSOC 2026',
      type: ChannelType.GuildCategory,
      reason: 'VidyaSetu GSSoC enhancement',
    });
    console.log('  📁 Created category: 🏆 GSSOC 2026');
  }

  const gssocChannels = [
    { name: 'gssoc-announcements', topic: 'GirlScript Summer of Code 2026 updates and announcements.' },
    { name: 'gssoc-leaderboard',   topic: 'Track contributor points and rankings.' },
    { name: 'claim-issues',        topic: 'Claim issues here before starting work. Tag maintainers for assignment.' },
    { name: 'pr-reviews',          topic: 'Share your PRs for review and feedback from maintainers.' },
    { name: 'doubts',              topic: 'Stuck? Ask your questions here — no question is too basic!' },
  ];

  for (const ch of gssocChannels) {
    const existing = guild.channels.cache.find(
      c => c.name === ch.name && c.parentId === gssocCat.id
    );
    if (!existing) {
      await guild.channels.create({
        name: ch.name,
        type: ChannelType.GuildText,
        parent: gssocCat.id,
        topic: ch.topic,
        reason: 'VidyaSetu GSSoC enhancement',
      });
      console.log(`  ✅ Created channel: #${ch.name}`);
    }
  }

  // Find or create PROJECT INFO category
  let projectCat = guild.channels.cache.find(
    c => c.name === '📐 PROJECT' && c.type === ChannelType.GuildCategory
  );
  if (!projectCat) {
    projectCat = await guild.channels.create({
      name: '📐 PROJECT',
      type: ChannelType.GuildCategory,
      reason: 'VidyaSetu project enhancement',
    });
    console.log('  📁 Created category: 📐 PROJECT');
  }

  const projectChannels = [
    { name: 'tech-stack',       topic: 'Deep dive into our tech stack — Next.js, TypeScript, Prisma, PostgreSQL, and more.' },
    { name: 'architecture',     topic: 'System design, database schema, and architecture discussions.' },
    { name: 'ui-ux-design',     topic: 'Design discussions, mockups, and UI/UX feedback.' },
    { name: 'ai-ml-features',   topic: 'AI-powered features — quiz generation, answer evaluation, adaptive learning.' },
    { name: 'deployment',       topic: 'Vercel deployment, CI/CD, and infrastructure discussions.' },
  ];

  for (const ch of projectChannels) {
    const existing = guild.channels.cache.find(
      c => c.name === ch.name && c.parentId === projectCat.id
    );
    if (!existing) {
      await guild.channels.create({
        name: ch.name,
        type: ChannelType.GuildText,
        parent: projectCat.id,
        topic: ch.topic,
        reason: 'VidyaSetu project enhancement',
      });
      console.log(`  ✅ Created channel: #${ch.name}`);
    }
  }

  // ── 3. Send rich embeds to channels ──
  console.log('\n━━━ Sending Project Embeds ━━━');

  // Refetch channels after creation
  await guild.channels.fetch();

  // ── 3a. Tech Stack Embed ──
  const techChannel = guild.channels.cache.find(c => c.name === 'tech-stack');
  if (techChannel) {
    const techEmbed = new EmbedBuilder()
      .setTitle('⚡ VidyaSetu Tech Stack')
      .setDescription('Our full technology stack — everything you need to know before contributing.')
      .addFields(
        {
          name: '🖥️ Frontend',
          value: [
            '**Next.js 16** — React framework with SSR & API routes',
            '**React** — UI component library',
            '**TypeScript** — Type-safe JavaScript',
            '**Tailwind CSS** — Utility-first styling',
          ].join('\n'),
        },
        {
          name: '⚙️ Backend & Database',
          value: [
            '**Next.js API Routes** — Serverless backend',
            '**Prisma ORM** — Type-safe database client',
            '**PostgreSQL** — Relational database',
            '**NextAuth.js** — Authentication (Google OAuth)',
          ].join('\n'),
        },
        {
          name: '☁️ Infrastructure',
          value: [
            '**Vercel** — Hosting & deployment',
            '**Cloudinary** — Image/media storage',
            '**Supabase/Neon** — Hosted PostgreSQL options',
          ].join('\n'),
        },
        {
          name: '🛠️ Dev Tools',
          value: [
            '**pnpm** — Package manager',
            '**ESLint** — Code linting',
            '**Prisma Studio** — Database GUI',
          ].join('\n'),
        },
      )
      .setColor(COLORS.brand)
      .setFooter({ text: '💡 New to any of these? Ask in #doubts!' });

    await techChannel.send({ embeds: [techEmbed] });
    console.log('  ✅ Tech stack embed sent');
  }

  // ── 3b. Architecture Overview ──
  const archChannel = guild.channels.cache.find(c => c.name === 'architecture');
  if (archChannel) {
    const archEmbed = new EmbedBuilder()
      .setTitle('🏗️ VidyaSetu Architecture')
      .setDescription('High-level system architecture of the platform.')
      .addFields(
        {
          name: '📊 Core Modules',
          value: [
            '```',
            '┌─────────────────────────────────────────┐',
            '│              VidyaSetu Platform          │',
            '├─────────────┬─────────────┬──────────────┤',
            '│  📚 NCERT   │  📝 Quiz    │  🧠 AI      │',
            '│  Browser    │  Engine     │  Evaluator   │',
            '├─────────────┼─────────────┼──────────────┤',
            '│  📔 Notes   │  📊 Dash-   │  👤 Auth     │',
            '│  Manager    │  board      │  System      │',
            '├─────────────┴─────────────┴──────────────┤',
            '│          Prisma ORM + PostgreSQL          │',
            '└─────────────────────────────────────────┘',
            '```',
          ].join('\n'),
        },
        {
          name: '🔄 Data Flow',
          value: [
            '1. **Student** → Browses NCERT content by class/subject/chapter',
            '2. **Quiz Engine** → Generates practice/test/revision quizzes',
            '3. **AI Evaluator** → Scores subjective answers',
            '4. **Dashboard** → Shows analytics and progress',
            '5. **Admin** → Manages questions, chapters, and content',
          ].join('\n'),
        },
        {
          name: '📂 Key Directories',
          value: [
            '`/app` — Next.js app router pages & API routes',
            '`/components` — Reusable React components',
            '`/prisma` — Database schema & migrations',
            '`/lib` — Utility functions & helpers',
            '`/public` — Static assets',
          ].join('\n'),
        },
      )
      .setColor(COLORS.prisma);

    await archChannel.send({ embeds: [archEmbed] });
    console.log('  ✅ Architecture embed sent');
  }

  // ── 3c. GSSoC Welcome ──
  const gssocAnnouncementChannel = guild.channels.cache.find(c => c.name === 'gssoc-announcements');
  if (gssocAnnouncementChannel) {
    const gssocEmbed = new EmbedBuilder()
      .setTitle('🏆 Welcome to GSSoC 2026 × VidyaSetu!')
      .setDescription(
        `**GirlScript Summer of Code** is a 3-month open source program that helps beginners start their open source journey.\n\n` +
        `VidyaSetu is an official GSSoC 2026 project! This means:\n\n` +
        `🎯 **Every merged PR earns you GSSoC points**\n` +
        `🏅 **Top contributors get certificates and swag**\n` +
        `📈 **Great opportunity to build your profile**`
      )
      .addFields(
        {
          name: '📋 How GSSoC Points Work',
          value: [
            '| Label | Points |',
            '|-------|--------|',
            '| `good first issue` | 10 pts |',
            '| `beginner friendly` | 15 pts |',
            '| `bug` | 20 pts |',
            '| `enhancement` | 25 pts |',
            '| `documentation` | 15 pts |',
          ].join('\n'),
        },
        {
          name: '🚀 Quick Start',
          value: [
            '1. Check issues with the `gssoc` label',
            '2. Comment "I\'d like to work on this" on the issue',
            '3. Wait for maintainer assignment',
            '4. Fork, code, and submit your PR',
            '5. Get it reviewed and merged → earn points!',
          ].join('\n'),
        },
      )
      .setColor(COLORS.gssoc)
      .setFooter({ text: 'GSSoC 2026 • Open Source for Everyone' })
      .setTimestamp();

    await gssocAnnouncementChannel.send({ embeds: [gssocEmbed] });
    console.log('  ✅ GSSoC welcome embed sent');
  }

  // ── 3d. Claim Issues Guide ──
  const claimChannel = guild.channels.cache.find(c => c.name === 'claim-issues');
  if (claimChannel) {
    const claimEmbed = new EmbedBuilder()
      .setTitle('🎯 How to Claim Issues')
      .setDescription('Follow this process to claim and work on issues:')
      .addFields(
        {
          name: 'Step 1: Find an Issue',
          value: [
            '🔗 [All Issues](https://github.com/MRIARC-08/VidyaSetu/issues)',
            '🌱 [Good First Issues](https://github.com/MRIARC-08/VidyaSetu/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)',
            '🏷️ [GSSoC Issues](https://github.com/MRIARC-08/VidyaSetu/issues?q=is%3Aissue+is%3Aopen+label%3Agssoc)',
          ].join('\n'),
        },
        {
          name: 'Step 2: Claim It',
          value: 'Comment on the GitHub issue:\n> "I\'d like to work on this. ETA: X days"\n\nThen post here with the issue link and a brief plan.',
        },
        {
          name: 'Step 3: Get Assigned',
          value: 'A maintainer will assign you. **Do NOT start coding until assigned** — duplicate PRs will be closed.',
        },
        {
          name: 'Step 4: Submit PR',
          value: 'Link your PR to the issue using `Fixes #123` in the PR description. Share it in #pr-reviews for faster feedback.',
        },
        {
          name: '⚠️ Rules',
          value: [
            '• One issue at a time per contributor',
            '• If no progress in 3 days, issue may be reassigned',
            '• Don\'t submit PRs for unassigned issues',
            '• Be respectful to other contributors',
          ].join('\n'),
        },
      )
      .setColor(COLORS.gold);

    await claimChannel.send({ embeds: [claimEmbed] });
    console.log('  ✅ Claim issues guide sent');
  }

  // ── 3e. Enhanced Getting Started (update the existing channel) ──
  const gettingStarted = guild.channels.cache.find(c => c.name === 'getting-started');
  if (gettingStarted) {
    const setupEmbed = new EmbedBuilder()
      .setTitle('🔧 VidyaSetu — Full Development Setup')
      .setDescription('Complete setup guide with all environment variables explained.')
      .addFields(
        {
          name: '📋 Prerequisites',
          value: '• Node.js (v18+)\n• pnpm (not npm!)\n• PostgreSQL database (local Docker or hosted)\n• Git',
        },
        {
          name: '🔨 Setup Steps',
          value: [
            '```bash',
            '# 1. Fork & clone',
            'git clone https://github.com/YOUR_USERNAME/VidyaSetu.git',
            'cd VidyaSetu',
            '',
            '# 2. Install dependencies (use pnpm!)',
            'pnpm install',
            '',
            '# 3. Setup environment',
            'cp .env.example .env',
            '',
            '# 4. Setup database',
            '# Option A: Docker',
            'docker-compose up -d',
            '',
            '# Option B: Use Supabase/Neon (free tier)',
            '# Copy your connection string to .env',
            '',
            '# 5. Run migrations',
            'pnpm prisma migrate dev',
            '',
            '# 6. Start development server',
            'pnpm dev',
            '```',
          ].join('\n'),
        },
        {
          name: '🔐 Environment Variables',
          value: [
            '`DATABASE_URL` — PostgreSQL connection string',
            '`DIRECT_URL` — Direct DB connection (for Prisma migrations)',
            '`JWT_SECRET` — Run `openssl rand -base64 32`',
            '`NEXTAUTH_URL` — `http://localhost:3000`',
            '`GOOGLE_CLIENT_ID` — From Google Cloud Console',
            '`GOOGLE_CLIENT_SECRET` — From Google Cloud Console',
          ].join('\n'),
        },
      )
      .setColor(COLORS.success)
      .setFooter({ text: '🌐 Live app: vidya-setu-pi.vercel.app' });

    await gettingStarted.send({ embeds: [setupEmbed] });
    console.log('  ✅ Enhanced getting-started guide sent');
  }

  // ── 3f. Project Info in the Welcome Channel ──
  const welcomeChannel = guild.channels.cache.find(c => c.name === 'welcome');
  if (welcomeChannel) {
    const projectEmbed = new EmbedBuilder()
      .setTitle('🌉 What is VidyaSetu?')
      .setDescription(
        `**VidyaSetu** (विद्या सेतु — *Bridge of Knowledge*) is an AI-powered adaptive study and assessment platform for NCERT-based learning.\n\n` +
        `We help students move from passive studying to **structured practice** with intelligent features.`
      )
      .addFields(
        {
          name: '✨ Key Features',
          value: [
            '📚 NCERT class, subject & chapter browsing',
            '📝 Chapter-based quiz creation (Practice / Test / Revision)',
            '🧠 AI-powered subjective answer evaluation',
            '📔 Notes upload & smart extraction',
            '📊 Student dashboard with analytics',
            '👨‍💼 Admin panel for content management',
          ].join('\n'),
        },
        {
          name: '🔗 Quick Links',
          value: [
            '🌐 [Live App](https://vidya-setu-pi.vercel.app/)',
            '📦 [GitHub Repo](https://github.com/MRIARC-08/VidyaSetu)',
            '📖 [Documentation](https://vidya-setu-pi.vercel.app/docs)',
            '🏆 [GSSoC 2026 Project](https://gssoc.girlscript.tech/)',
          ].join('\n'),
        },
      )
      .setColor(COLORS.brand)
      .setImage('https://img.shields.io/badge/GSSoC-2026-blueviolet?style=for-the-badge&logo=girlscript&logoColor=white')
      .setFooter({ text: 'VidyaSetu • Open Source Education Platform • GSSoC 2026' })
      .setTimestamp();

    await welcomeChannel.send({ embeds: [projectEmbed] });
    console.log('  ✅ Project overview embed sent to #welcome');
  }

  // ── 3g. Leaderboard Template ──
  const leaderboardChannel = guild.channels.cache.find(c => c.name === 'gssoc-leaderboard');
  if (leaderboardChannel) {
    const lbEmbed = new EmbedBuilder()
      .setTitle('📊 GSSoC 2026 — VidyaSetu Leaderboard')
      .setDescription(
        '**Top Contributors** — Updated weekly by maintainers\n\n' +
        '```\n' +
        '🥇 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '   #1  ????              — 0 pts\n' +
        '🥈 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '   #2  ????              — 0 pts\n' +
        '🥉 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '   #3  ????              — 0 pts\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '   #4  ????              — 0 pts\n' +
        '   #5  ????              — 0 pts\n' +
        '```\n\n' +
        '🏆 **Be the first to claim the #1 spot!**\n' +
        'Start by picking a `good first issue` from the repo.'
      )
      .setColor(COLORS.gold)
      .setFooter({ text: 'Points are based on merged PRs and issue labels' });

    await leaderboardChannel.send({ embeds: [lbEmbed] });
    console.log('  ✅ Leaderboard template sent');
  }

  // ── 3h. AI/ML Features Discussion Starter ──
  const aiChannel = guild.channels.cache.find(c => c.name === 'ai-ml-features');
  if (aiChannel) {
    const aiEmbed = new EmbedBuilder()
      .setTitle('🧠 AI/ML Features in VidyaSetu')
      .setDescription('VidyaSetu uses AI to make education smarter. Here\'s what we\'re building:')
      .addFields(
        {
          name: '🎯 Current AI Features',
          value: [
            '**Subjective Answer Evaluation** — AI grades written answers',
            '**Adaptive Quiz Generation** — Questions adapt to student level',
            '**Notes Extraction** — Extract key points from uploaded notes',
          ].join('\n'),
        },
        {
          name: '💡 Planned / Ideas',
          value: [
            '🔮 Personalized revision schedules (spaced repetition)',
            '🔮 Natural language question generation from textbooks',
            '🔮 Student performance prediction',
            '🔮 Chatbot tutor for doubt resolution',
            '🔮 OCR for handwritten notes',
          ].join('\n'),
        },
        {
          name: '🤝 Want to contribute to AI features?',
          value: 'Look for issues labeled `enhancement` or `ai-ml` in the repo, or propose your own ideas here!',
        },
      )
      .setColor(COLORS.react);

    await aiChannel.send({ embeds: [aiEmbed] });
    console.log('  ✅ AI/ML features embed sent');
  }

  // ── 3i. UI/UX Design Channel Starter ──
  const uiChannel = guild.channels.cache.find(c => c.name === 'ui-ux-design');
  if (uiChannel) {
    const uiEmbed = new EmbedBuilder()
      .setTitle('🎨 UI/UX Design Discussion')
      .setDescription(
        'VidyaSetu\'s design goal: **Make education feel premium, not boring.**\n\n' +
        'We use **Tailwind CSS** for styling. The live app is at:\n' +
        '🌐 [vidya-setu-pi.vercel.app](https://vidya-setu-pi.vercel.app/)\n\n' +
        '**Share your ideas here:**\n' +
        '• Screenshot mockups or Figma links\n' +
        '• UI bug reports with screenshots\n' +
        '• Accessibility improvement suggestions\n' +
        '• Mobile responsiveness issues\n' +
        '• Color scheme and typography feedback'
      )
      .setColor(COLORS.tailwind)
      .setFooter({ text: 'Good UI PRs are highly valued! 🎨' });

    await uiChannel.send({ embeds: [uiEmbed] });
    console.log('  ✅ UI/UX design embed sent');
  }

  // ── 3j. Deployment Info ──
  const deployChannel = guild.channels.cache.find(c => c.name === 'deployment');
  if (deployChannel) {
    const deployEmbed = new EmbedBuilder()
      .setTitle('🚀 Deployment & Infrastructure')
      .setDescription('How VidyaSetu is deployed and maintained.')
      .addFields(
        {
          name: '☁️ Hosting',
          value: '**Vercel** — Automatic deployments from `main` branch\nLive at: [vidya-setu-pi.vercel.app](https://vidya-setu-pi.vercel.app/)',
        },
        {
          name: '🗄️ Database',
          value: '**PostgreSQL** — Hosted on Supabase/Neon\nManaged via **Prisma ORM** with migrations',
        },
        {
          name: '📸 Media',
          value: '**Cloudinary** — Image uploads and transformations',
        },
        {
          name: '🔄 CI/CD Flow',
          value: [
            '```',
            'Push to main → Vercel auto-deploys',
            'PR created   → Preview deployment generated',
            'PR merged    → Production updated',
            '```',
          ].join('\n'),
        },
      )
      .setColor(COLORS.success);

    await deployChannel.send({ embeds: [deployEmbed] });
    console.log('  ✅ Deployment info embed sent');
  }

  console.log('\n🎉 ══════════════════════════════════════');
  console.log('   VidyaSetu Discord enhancement complete!');
  console.log('══════════════════════════════════════════\n');
  console.log('New additions:');
  console.log('  • 🏆 GSSoC 2026 category with 5 channels');
  console.log('  • 📐 Project category with 5 channels');
  console.log('  • 5 new GSSoC-specific roles');
  console.log('  • Rich embeds: Tech stack, Architecture,');
  console.log('    GSSoC guide, Issue claiming, Leaderboard,');
  console.log('    AI/ML features, UI/UX, Deployment info');
  console.log('  • Updated welcome & getting-started content\n');

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
