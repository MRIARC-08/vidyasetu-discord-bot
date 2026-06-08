require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  Events,
  ActivityType,
} = require('discord.js');

// ═══════════════════════════════════════════════════
// 🤖 BOT CLIENT
// ═══════════════════════════════════════════════════
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ],
});

// ═══════════════════════════════════════════════════
// 🎨 REACTION ROLE MAPPING
// ═══════════════════════════════════════════════════
const REACTION_ROLES = {
  '🎨': '🎨 Frontend',
  '⚙️': '⚙️ Backend',
  '📱': '📱 Mobile',
  '📝': '📝 Docs',
};

// ═══════════════════════════════════════════════════
// ✅ BOT READY
// ═══════════════════════════════════════════════════
client.once(Events.ClientReady, () => {
  console.log(`\n🤖 Vidyasetu Bot is online as ${client.user.tag}!`);
  console.log(`📡 Serving ${client.guilds.cache.size} server(s)\n`);

  // Set bot status
  client.user.setActivity('for contributors 🌉', { type: ActivityType.Watching });
});

// ═══════════════════════════════════════════════════
// 👋 WELCOME NEW MEMBERS
// ═══════════════════════════════════════════════════
client.on(Events.GuildMemberAdd, async (member) => {
  console.log(`👋 New member joined: ${member.user.tag}`);

  // Auto-assign "New Contributor" role
  try {
    const newContribRole = member.guild.roles.cache.find(r => r.name === '🌱 New Contributor');
    if (newContribRole) {
      await member.roles.add(newContribRole);
      console.log(`  ✅ Assigned "New Contributor" role to ${member.user.tag}`);
    }
  } catch (err) {
    console.error(`  ❌ Failed to assign role:`, err.message);
  }

  // Send welcome message
  const welcomeChannel = member.guild.channels.cache.find(c => c.name === 'welcome');
  if (welcomeChannel) {
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`👋 Welcome, ${member.user.username}!`)
      .setDescription(
        `Hey ${member}! Welcome to **Vidyasetu Open Source Community**! 🎉\n\n` +
        `We're glad to have you here. Here's how to get started:\n\n` +
        `📜 Read the rules in <#${member.guild.channels.cache.find(c => c.name === 'rules')?.id || 'rules'}>\n` +
        `🎭 Pick your roles in <#${member.guild.channels.cache.find(c => c.name === 'pick-your-role')?.id || 'pick-your-role'}>\n` +
        `💬 Introduce yourself in <#${member.guild.channels.cache.find(c => c.name === 'introductions')?.id || 'introductions'}>\n` +
        `🚀 Check <#${member.guild.channels.cache.find(c => c.name === 'good-first-issues')?.id || 'good-first-issues'}> for beginner-friendly tasks\n\n` +
        `Happy contributing! 🌉`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setColor('#5865F2')
      .setFooter({ text: `Member #${member.guild.memberCount}` })
      .setTimestamp();

    try {
      await welcomeChannel.send({ embeds: [welcomeEmbed] });
    } catch (err) {
      console.error('  ❌ Failed to send welcome message:', err.message);
    }
  }
});

// ═══════════════════════════════════════════════════
// 👋 GOODBYE MEMBERS
// ═══════════════════════════════════════════════════
client.on(Events.GuildMemberRemove, async (member) => {
  console.log(`😢 Member left: ${member.user.tag}`);

  const generalChannel = member.guild.channels.cache.find(c => c.name === 'general');
  if (generalChannel) {
    try {
      await generalChannel.send(`😢 **${member.user.username}** has left the community. We hope to see them again!`);
    } catch (err) {
      console.error('  ❌ Failed to send goodbye message:', err.message);
    }
  }
});

// ═══════════════════════════════════════════════════
// 🎭 REACTION ROLE ADD
// ═══════════════════════════════════════════════════
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;

  // Fetch partial data if needed
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }

  // Only handle reactions in "pick-your-role" channel
  if (reaction.message.channel.name !== 'pick-your-role') return;

  const roleName = REACTION_ROLES[reaction.emoji.name];
  if (!roleName) return;

  const guild = reaction.message.guild;
  const member = await guild.members.fetch(user.id);
  const role = guild.roles.cache.find(r => r.name === roleName);

  if (role) {
    try {
      await member.roles.add(role);
      console.log(`🎭 Added role "${roleName}" to ${user.tag}`);
    } catch (err) {
      console.error(`❌ Failed to add role "${roleName}":`, err.message);
    }
  }
});

// ═══════════════════════════════════════════════════
// 🎭 REACTION ROLE REMOVE
// ═══════════════════════════════════════════════════
client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }

  if (reaction.message.channel.name !== 'pick-your-role') return;

  const roleName = REACTION_ROLES[reaction.emoji.name];
  if (!roleName) return;

  const guild = reaction.message.guild;
  const member = await guild.members.fetch(user.id);
  const role = guild.roles.cache.find(r => r.name === roleName);

  if (role) {
    try {
      await member.roles.remove(role);
      console.log(`🎭 Removed role "${roleName}" from ${user.tag}`);
    } catch (err) {
      console.error(`❌ Failed to remove role "${roleName}":`, err.message);
    }
  }
});

// ═══════════════════════════════════════════════════
// 💬 BASIC COMMANDS (PREFIX: !)
// ═══════════════════════════════════════════════════
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ── !help ──
  if (command === 'help') {
    const helpEmbed = new EmbedBuilder()
      .setTitle('🤖 VidyaSetu Bot Commands')
      .setDescription('Here are the available commands:')
      .addFields(
        { name: '📋 Issue Commands', value: [
          '`!issues` — latest 10 open issues',
          '`!issues 20` — issues 11-20',
          '`!issues 30` — issues 21-30',
          '`!issues #42` — view issue #42 in detail',
          '`!issues unassigned` — grab an unassigned issue',
          '`!issues assigned <user>` — issues by assignee',
          '`!issues bug` — filter by label',
          '`!issues all` — full summary with stats',
        ].join('\n') },
        { name: '🔀 PR Commands', value: [
          '`!prs` — latest open pull requests',
          '`!prs 20` — PRs page 2',
          '`!prs #42` — view PR #42 in detail',
        ].join('\n') },
        { name: '📚 Info Commands', value: [
          '`!repo` · `!techstack` · `!live` · `!gssoc`',
          '`!contribute` · `!ping` · `!stats`',
        ].join('\n') },
      )
      .setColor('#6C5CE7')
      .setFooter({ text: 'VidyaSetu Bot • Bridging Knowledge 🌉' });

    await message.reply({ embeds: [helpEmbed] });
  }

  // ── !repo ──
  else if (command === 'repo') {
    const repoEmbed = new EmbedBuilder()
      .setTitle('📦 VidyaSetu Repository')
      .setDescription('Check out our GitHub repository:')
      .addFields(
        { name: '🔗 Repository', value: '[github.com/MRIARC-08/VidyaSetu](https://github.com/MRIARC-08/VidyaSetu)' },
        { name: '⭐ Star the repo!', value: 'Show your support by starring the repository!' },
      )
      .setColor('#6C5CE7');

    await message.reply({ embeds: [repoEmbed] });
  }

  // ── !issues ──
  else if (command === 'issues') {
    const issuesEmbed = new EmbedBuilder()
      .setTitle('🐛 Open Issues')
      .setDescription(
        '**Find something to work on:**\n\n' +
        '🔗 [All Issues](https://github.com/MRIARC-08/VidyaSetu/issues)\n' +
        '🌱 [Good First Issues](https://github.com/MRIARC-08/VidyaSetu/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)\n' +
        '🏷️ [GSSoC Issues](https://github.com/MRIARC-08/VidyaSetu/issues?q=is%3Aissue+is%3Aopen+label%3Agssoc)\n' +
        '🐛 [Bug Reports](https://github.com/MRIARC-08/VidyaSetu/issues?q=is%3Aissue+is%3Aopen+label%3Abug)\n' +
        '✨ [Enhancements](https://github.com/MRIARC-08/VidyaSetu/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)\n' +
        '📝 [Documentation](https://github.com/MRIARC-08/VidyaSetu/issues?q=is%3Aissue+is%3Aopen+label%3Adocumentation)'
      )
      .setColor('#57F287');

    await message.reply({ embeds: [issuesEmbed] });
  }

  // ── !contribute ──
  else if (command === 'contribute') {
    const contribEmbed = new EmbedBuilder()
      .setTitle('💡 How to Contribute')
      .setDescription(
        '**Follow these steps to make your first contribution:**\n\n' +
        '1️⃣ Fork the repo on GitHub\n' +
        '2️⃣ Clone your fork: `git clone https://github.com/YOUR_USERNAME/VidyaSetu.git`\n' +
        '3️⃣ Install deps: `pnpm install`\n' +
        '4️⃣ Setup env: `cp .env.example .env`\n' +
        '5️⃣ Run migrations: `pnpm prisma migrate dev`\n' +
        '6️⃣ Start dev server: `pnpm dev`\n' +
        '7️⃣ Create a branch: `git checkout -b feature/my-feature`\n' +
        '8️⃣ Code, commit, push, and open a PR!\n\n' +
        '📖 [Full Contributing Guide](https://github.com/MRIARC-08/VidyaSetu/blob/main/CONTRIBUTING.md)'
      )
      .setColor('#E91E63');

    await message.reply({ embeds: [contribEmbed] });
  }

  // ── !techstack ──
  else if (command === 'techstack') {
    const techEmbed = new EmbedBuilder()
      .setTitle('⚡ VidyaSetu Tech Stack')
      .addFields(
        { name: '🖥️ Frontend', value: 'Next.js 16 • React • TypeScript • Tailwind CSS', inline: false },
        { name: '⚙️ Backend', value: 'Next.js API Routes • Prisma ORM • PostgreSQL • NextAuth', inline: false },
        { name: '☁️ Infra', value: 'Vercel • Cloudinary • Supabase/Neon', inline: false },
        { name: '🛠️ Tools', value: 'pnpm • ESLint • Prisma Studio', inline: false },
      )
      .setColor('#3178C6')
      .setFooter({ text: 'Check #tech-stack for deep dives!' });

    await message.reply({ embeds: [techEmbed] });
  }

  // ── !live ──
  else if (command === 'live') {
    const liveEmbed = new EmbedBuilder()
      .setTitle('🌐 VidyaSetu — Live App')
      .setDescription(
        '**Try the platform yourself!**\n\n' +
        '🔗 [vidya-setu-pi.vercel.app](https://vidya-setu-pi.vercel.app/)\n' +
        '📖 [Documentation](https://vidya-setu-pi.vercel.app/docs)\n\n' +
        'Found a bug? Report it in #issues or on [GitHub](https://github.com/MRIARC-08/VidyaSetu/issues/new)!'
      )
      .setColor('#00B894');

    await message.reply({ embeds: [liveEmbed] });
  }

  // ── !gssoc ──
  else if (command === 'gssoc') {
    const gssocEmbed = new EmbedBuilder()
      .setTitle('🏆 GSSoC 2026 — VidyaSetu')
      .setDescription(
        '**VidyaSetu is a GirlScript Summer of Code 2026 project!**\n\n' +
        '🎯 Every merged PR earns GSSoC points\n' +
        '🏅 Top contributors get certificates & swag\n' +
        '📈 Build your open source profile\n\n' +
        '**Issue Labels for Points:**\n' +
        '`good first issue` (10 pts) • `beginner friendly` (15 pts)\n' +
        '`bug` (20 pts) • `enhancement` (25 pts) • `documentation` (15 pts)\n\n' +
        '🔗 [GSSoC Website](https://gssoc.girlscript.tech/)\n' +
        '📋 [Claim an Issue](https://github.com/MRIARC-08/VidyaSetu/issues?q=is%3Aissue+is%3Aopen+label%3Agssoc)'
      )
      .setColor('#FF6B6B');

    await message.reply({ embeds: [gssocEmbed] });
  }


  // ── !ping ──
  else if (command === 'ping') {
    const sent = await message.reply('🏓 Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`🏓 **Pong!** Latency: \`${latency}ms\` | API: \`${Math.round(client.ws.ping)}ms\``);
  }

  // ═══════════════════════════════════════════════════
  // 📋 GITHUB ISSUES SYSTEM
  // ═══════════════════════════════════════════════════
  //
  // Commands:
  //   !issues              → first 10 issues
  //   !issues 20           → issues 11-20 (page by offset)
  //   !issues 30           → issues 21-30
  //   !issues #42          → view specific issue #42
  //   !issues unassigned   → only unassigned issues
  //   !issues assigned sam → issues assigned to "sam"
  //   !issues bug          → filter by label
  //   !issues gssoc        → filter by "gssoc" label
  //   !issues all          → summary of all open issues
  //   !prs                 → open pull requests
  //   !prs 20              → PRs page 2
  //
  // ═══════════════════════════════════════════════════

  else if (command === 'issues' || command === 'issue' || command === 'liveissues') {
    const GITHUB_API = 'https://api.github.com/repos/MRIARC-08/VidyaSetu';
    const HEADERS = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'VidyaSetu-Discord-Bot',
    };
    const PER_PAGE = 10;

    const labelEmojis = {
      'bug': '🐛', 'enhancement': '✨', 'good first issue': '🌱',
      'beginner friendly': '🌿', 'documentation': '📝', 'gssoc': '🏆',
      'help wanted': '🆘', 'question': '❓', 'priority: high': '🔴',
      'priority: medium': '🟡', 'priority: low': '🟢',
    };

    const subCommand = args[0]?.toLowerCase() || '';
    const loading = await message.reply('🔄 Fetching from GitHub...');

    try {
      // ── !issues #42 → View specific issue ──
      if (subCommand.startsWith('#') || (!isNaN(subCommand) && parseInt(subCommand) <= 0)) {
        const issueNum = subCommand.replace('#', '');
        const res = await fetch(`${GITHUB_API}/issues/${issueNum}`, { headers: HEADERS });
        if (!res.ok) throw new Error(`Issue #${issueNum} not found`);
        const issue = await res.json();

        const labels = issue.labels.map(l => labelEmojis[l.name.toLowerCase()] || `\`${l.name}\``).join(' ') || 'None';
        const assignees = issue.assignees.length > 0
          ? issue.assignees.map(a => `@${a.login}`).join(', ')
          : '🟢 Unassigned';
        const age = Math.floor((Date.now() - new Date(issue.created_at)) / (1000 * 60 * 60 * 24));

        const embed = new EmbedBuilder()
          .setTitle(`${issue.pull_request ? '🔀' : '📋'} #${issue.number} — ${issue.title}`)
          .setURL(issue.html_url)
          .setDescription(issue.body ? issue.body.slice(0, 1000) + (issue.body.length > 1000 ? '...' : '') : '*No description*')
          .addFields(
            { name: '🏷️ Labels', value: labels, inline: true },
            { name: '👤 Assignees', value: assignees, inline: true },
            { name: '📅 Created', value: `${age} days ago`, inline: true },
            { name: '💬 Comments', value: `${issue.comments}`, inline: true },
            { name: '📌 State', value: issue.state === 'open' ? '🟢 Open' : '🔴 Closed', inline: true },
            { name: '👤 Author', value: `@${issue.user.login}`, inline: true },
          )
          .setColor(issue.state === 'open' ? '#57F287' : '#ED4245')
          .setFooter({ text: 'VidyaSetu • Live from GitHub' })
          .setTimestamp(new Date(issue.created_at));

        await loading.edit({ content: '', embeds: [embed] });
        return;
      }

      // ── !issues all → Summary ──
      if (subCommand === 'all' || subCommand === 'summary') {
        // Fetch all issues to count
        const res = await fetch(`${GITHUB_API}/issues?state=open&per_page=100`, { headers: HEADERS });
        const allItems = await res.json();
        const allIssues = allItems.filter(i => !i.pull_request);

        const unassigned = allIssues.filter(i => !i.assignee).length;
        const assigned = allIssues.filter(i => i.assignee).length;

        // Count by label
        const labelCounts = {};
        allIssues.forEach(issue => {
          issue.labels.forEach(l => {
            const name = l.name.toLowerCase();
            labelCounts[name] = (labelCounts[name] || 0) + 1;
          });
        });

        const labelLines = Object.entries(labelCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, count]) => `${labelEmojis[name] || '🏷️'} \`${name}\` — **${count}**`)
          .join('\n');

        // Top assignees
        const assigneeCounts = {};
        allIssues.forEach(issue => {
          if (issue.assignee) {
            const login = issue.assignee.login;
            assigneeCounts[login] = (assigneeCounts[login] || 0) + 1;
          }
        });

        const assigneeLines = Object.entries(assigneeCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count], i) => `${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} @${name} — **${count}** issues`)
          .join('\n') || 'No assignees yet';

        const embed = new EmbedBuilder()
          .setTitle('📊 VidyaSetu Issues — Summary')
          .addFields(
            { name: '📋 Total Open Issues', value: `**${allIssues.length}**`, inline: true },
            { name: '🟢 Unassigned', value: `**${unassigned}**`, inline: true },
            { name: '👤 Assigned', value: `**${assigned}**`, inline: true },
            { name: '🏷️ By Label', value: labelLines || 'No labels', inline: false },
            { name: '🏆 Top Assignees', value: assigneeLines, inline: false },
            { name: '💡 Commands', value: [
              '`!issues` — browse issues (page 1)',
              '`!issues 20` — page 2 (issues 11-20)',
              '`!issues #42` — view issue #42',
              '`!issues unassigned` — grab one!',
              '`!issues assigned <user>` — by assignee',
              '`!issues bug` — filter by label',
            ].join('\n'), inline: false },
          )
          .setColor('#6C5CE7')
          .setFooter({ text: 'Live from GitHub API' })
          .setTimestamp();

        await loading.edit({ content: '', embeds: [embed] });
        return;
      }

      // ── Build API URL based on filters ──
      let apiUrl = `${GITHUB_API}/issues?state=open&per_page=100&sort=created&direction=desc`;
      let filterLabel = '';
      let filterAssignee = '';
      let filterUnassigned = false;
      let page = 1;

      if (subCommand === 'unassigned') {
        filterUnassigned = true;
      } else if (subCommand === 'assigned') {
        filterAssignee = args[1]?.toLowerCase() || '';
        if (!filterAssignee) {
          await loading.edit('❌ Usage: `!issues assigned <username>`');
          return;
        }
      } else if (!isNaN(subCommand) && parseInt(subCommand) > 0) {
        // Number = offset (10 = page 1, 20 = page 2, 30 = page 3)
        const offset = parseInt(subCommand);
        page = Math.ceil(offset / PER_PAGE);
      } else if (subCommand) {
        // Treat as label filter — join multi-word labels
        filterLabel = args.join(' ');
        apiUrl += `&labels=${encodeURIComponent(filterLabel)}`;
      }

      const res = await fetch(apiUrl, { headers: HEADERS });
      if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);

      let allIssues = (await res.json()).filter(i => !i.pull_request);

      // Apply filters
      if (filterUnassigned) {
        allIssues = allIssues.filter(i => !i.assignee);
      }
      if (filterAssignee) {
        allIssues = allIssues.filter(i =>
          i.assignee && i.assignee.login.toLowerCase().includes(filterAssignee)
        );
      }

      const totalIssues = allIssues.length;
      const totalPages = Math.ceil(totalIssues / PER_PAGE);
      const startIdx = (page - 1) * PER_PAGE;
      const pageIssues = allIssues.slice(startIdx, startIdx + PER_PAGE);

      if (pageIssues.length === 0) {
        let msg = '📭 No issues found';
        if (filterUnassigned) msg += ' that are unassigned';
        if (filterAssignee) msg += ` assigned to "${filterAssignee}"`;
        if (filterLabel) msg += ` with label "${filterLabel}"`;
        await loading.edit(msg + '.');
        return;
      }

      const issueLines = pageIssues.map((issue, i) => {
        const labels = issue.labels
          .map(l => labelEmojis[l.name.toLowerCase()] || `\`${l.name}\``)
          .join(' ');
        const assignee = issue.assignee ? `👤 @${issue.assignee.login}` : '🟢 **Unassigned**';
        const age = Math.floor((Date.now() - new Date(issue.created_at)) / (1000 * 60 * 60 * 24));
        const comments = issue.comments > 0 ? ` 💬${issue.comments}` : '';
        return `**${startIdx + i + 1}.** [#${issue.number} ${issue.title}](${issue.html_url})\n   ${labels} │ ${assignee} │ ${age}d ago${comments}`;
      });

      // Build title
      let title = '📋 VidyaSetu Issues';
      if (filterUnassigned) title += ' — 🟢 Unassigned';
      else if (filterAssignee) title += ` — 👤 @${filterAssignee}`;
      else if (filterLabel) title += ` — 🏷️ ${filterLabel}`;

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(issueLines.join('\n\n'))
        .setColor('#6C5CE7')
        .setFooter({ text: `Page ${page}/${totalPages} • ${totalIssues} total issues • Live from GitHub` })
        .setTimestamp();

      // Add navigation help
      const navParts = [];
      if (page > 1) navParts.push(`⬅️ \`!issues ${(page - 1) * PER_PAGE}\``);
      if (page < totalPages) navParts.push(`➡️ \`!issues ${(page + 1) * PER_PAGE}\``);
      navParts.push('📊 `!issues all`');
      navParts.push('🔍 `!issues #<num>`');

      embed.addFields({ name: '📖 Navigation', value: navParts.join(' │ ') });

      await loading.edit({ content: '', embeds: [embed] });
    } catch (err) {
      console.error('❌ Issues error:', err.message);
      await loading.edit(`❌ ${err.message}`);
    }
  }

  // ── !prs / !latestpr ──
  else if (command === 'prs' || command === 'latestpr' || command === 'pr') {
    const GITHUB_API = 'https://api.github.com/repos/MRIARC-08/VidyaSetu';
    const HEADERS = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'VidyaSetu-Discord-Bot' };
    const PER_PAGE = 10;
    const subCommand = args[0]?.toLowerCase() || '';
    const loading = await message.reply('🔄 Fetching PRs from GitHub...');

    try {
      // ── !prs #42 → View specific PR ──
      if (subCommand.startsWith('#')) {
        const prNum = subCommand.replace('#', '');
        const res = await fetch(`${GITHUB_API}/pulls/${prNum}`, { headers: HEADERS });
        if (!res.ok) throw new Error(`PR #${prNum} not found`);
        const pr = await res.json();

        const age = Math.floor((Date.now() - new Date(pr.created_at)) / (1000 * 60 * 60 * 24));
        const embed = new EmbedBuilder()
          .setTitle(`🔀 #${pr.number} — ${pr.title}`)
          .setURL(pr.html_url)
          .setDescription(pr.body ? pr.body.slice(0, 1000) + (pr.body.length > 1000 ? '...' : '') : '*No description*')
          .addFields(
            { name: '👤 Author', value: `@${pr.user.login}`, inline: true },
            { name: '📌 Status', value: pr.draft ? '📝 Draft' : pr.merged ? '🟣 Merged' : '🟢 Open', inline: true },
            { name: '📅 Created', value: `${age} days ago`, inline: true },
            { name: '📝 Changes', value: `+${pr.additions} / -${pr.deletions} (${pr.changed_files} files)`, inline: true },
            { name: '💬 Comments', value: `${pr.comments + pr.review_comments}`, inline: true },
            { name: '🔀 Branch', value: `\`${pr.head.ref}\` → \`${pr.base.ref}\``, inline: true },
          )
          .setColor(pr.draft ? '#95A5A6' : pr.merged ? '#9B59B6' : '#57F287')
          .setTimestamp(new Date(pr.created_at));

        await loading.edit({ content: '', embeds: [embed] });
        return;
      }

      // ── Paginated PR list ──
      let page = 1;
      if (!isNaN(subCommand) && parseInt(subCommand) > 0) {
        page = Math.ceil(parseInt(subCommand) / PER_PAGE);
      }

      const res = await fetch(`${GITHUB_API}/pulls?state=open&per_page=100&sort=created&direction=desc`, { headers: HEADERS });
      const allPRs = await res.json();
      const totalPRs = allPRs.length;
      const totalPages = Math.ceil(totalPRs / PER_PAGE);
      const startIdx = (page - 1) * PER_PAGE;
      const pagePRs = allPRs.slice(startIdx, startIdx + PER_PAGE);

      if (pagePRs.length === 0) {
        await loading.edit('📭 No open pull requests. Submit one! 🚀');
        return;
      }

      const prLines = pagePRs.map((pr, i) => {
        const status = pr.draft ? '📝 Draft' : '🔍 Review';
        const age = Math.floor((Date.now() - new Date(pr.created_at)) / (1000 * 60 * 60 * 24));
        const labels = pr.labels?.map(l => `\`${l.name}\``).join(' ') || '';
        return `**${startIdx + i + 1}.** [#${pr.number} ${pr.title}](${pr.html_url})\n   👤 @${pr.user.login} │ ${status} │ ${age}d ago ${labels}`;
      });

      const embed = new EmbedBuilder()
        .setTitle('🔀 Open Pull Requests — VidyaSetu')
        .setDescription(prLines.join('\n\n'))
        .setColor('#57F287')
        .setFooter({ text: `Page ${page}/${totalPages} • ${totalPRs} total PRs • Live from GitHub` })
        .setTimestamp();

      const navParts = [];
      if (page > 1) navParts.push(`⬅️ \`!prs ${(page - 1) * PER_PAGE}\``);
      if (page < totalPages) navParts.push(`➡️ \`!prs ${(page + 1) * PER_PAGE}\``);
      navParts.push('🔍 `!prs #<num>`');
      if (navParts.length) embed.addFields({ name: '📖 Navigation', value: navParts.join(' │ ') });

      await loading.edit({ content: '', embeds: [embed] });
    } catch (err) {
      console.error('❌ PR error:', err.message);
      await loading.edit(`❌ ${err.message}`);
    }
  }

  // ── !stats ──
  else if (command === 'stats') {
    const guild = message.guild;
    const statsEmbed = new EmbedBuilder()
      .setTitle(`📊 ${guild.name} Stats`)
      .addFields(
        { name: '👥 Members',  value: `${guild.memberCount}`, inline: true },
        { name: '💬 Channels', value: `${guild.channels.cache.size}`, inline: true },
        { name: '🎭 Roles',    value: `${guild.roles.cache.size}`, inline: true },
        { name: '📅 Created',  value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '🤖 Bot Uptime', value: `<t:${Math.floor(client.readyTimestamp / 1000)}:R>`, inline: true },
      )
      .setColor('#5BC0EB')
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }));

    await message.reply({ embeds: [statsEmbed] });
  }
});

// ═══════════════════════════════════════════════════
// 🔐 LOGIN
// ═══════════════════════════════════════════════════
client.login(process.env.DISCORD_TOKEN);

// ═══════════════════════════════════════════════════
// 🌐 HEALTH CHECK SERVER (for Render / hosting)
// ═══════════════════════════════════════════════════
const http = require('http');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      bot: client.user?.tag || 'starting...',
      uptime: process.uptime(),
      servers: client.guilds?.cache.size || 0,
      timestamp: new Date().toISOString(),
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Health check server running on port ${PORT}`);
});
