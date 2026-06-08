const fs = require('fs');
const https = require('https');
const path = require('path');
const readline = require('readline');

// ═══════════════════════════════════════════════════
// ⚙️ CONFIGURATION
// ═══════════════════════════════════════════════════
const SERVICE_NAME = 'vidyasetu-discord';
const REPO_URL = 'https://github.com/MRIARC-08/vidyasetu-discord-bot';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Helper for HTTP requests using Node.js https module
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

// Parse local .env file
function parseEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  No local .env file found. Deploying without preconfigured variables.');
    return [];
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = [];
  const lines = envContent.split(/\r?\n/);

  for (const line of lines) {
    // Trim and ignore comments / empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove surrounding quotes if any
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Ignore PORT since Render injects its own
      if (key === 'PORT') continue;

      envVars.push({ key, value });
    }
  }

  return envVars;
}

async function main() {
  console.log('🚀 Starting Automated Render Deployment...\n');

  // 1. Get Render API Key
  let apiKey = process.env.RENDER_API_KEY;
  if (!apiKey) {
    apiKey = await askQuestion('🔑 Enter your Render API Key (or press Enter if set in env): ');
    apiKey = apiKey.trim();
  }

  if (!apiKey) {
    console.error('❌ Render API Key is required to deploy.');
    process.exit(1);
  }

  // 2. Fetch Workspace Owner
  console.log('\n📡 Fetching Render workspace owners...');
  const baseHeaders = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'VidyaSetu-Deployer'
  };

  let ownerId = '';
  try {
    const owners = await makeRequest({
      hostname: 'api.render.com',
      path: '/v1/owners?limit=20',
      method: 'GET',
      headers: baseHeaders
    });

    if (!owners || owners.length === 0) {
      throw new Error('No owner/workspace workspaces found associated with this API key.');
    }

    // Use the first owner
    const owner = owners[0].owner;
    ownerId = owner.id;
    console.log(`✅ Connected to workspace: ${owner.name} (${owner.email}) [ID: ${ownerId}]`);
  } catch (err) {
    console.error('❌ Failed to fetch Render workspace owners:', err.message);
    process.exit(1);
  }

  // 3. Parse local environment variables
  console.log('\n📝 Parsing environment variables from local .env...');
  const envVars = parseEnvFile();
  console.log(`✅ Found ${envVars.length} environment variables to upload.`);

  // 4. Create Web Service
  console.log(`\n☁️  Deploying web service "${SERVICE_NAME}" on Render...`);
  const deployPayload = {
    type: 'web_service',
    name: SERVICE_NAME,
    ownerId: ownerId,
    repo: REPO_URL,
    branch: 'master',
    autoDeploy: 'yes',
    serviceDetails: {
      runtime: 'node',
      plan: 'free',
      envSpecificDetails: {
        buildCommand: 'npm install',
        startCommand: 'npm start'
      }
    },
    envVars: envVars
  };

  try {
    const serviceInfo = await makeRequest({
      hostname: 'api.render.com',
      path: '/v1/services',
      method: 'POST',
      headers: baseHeaders
    }, deployPayload);

    console.log('\n🎉 Service successfully created!');
    const s = serviceInfo.service || serviceInfo;
    console.log(`ID:        ${s.id}`);
    console.log(`Status:    ${s.status}`);
    console.log(`URL:       ${s.url}`);
    console.log(`Dashboard: ${s.dashboardUrl || `https://dashboard.render.com/web/${s.id}`}`);
    console.log('\n💡 Tip: Your service is building! The bot will go online in a few minutes once the build completes.');
  } catch (err) {
    console.error('\n❌ Deployment failed:', err.message);
  }

  rl.close();
}

main().catch((err) => {
  console.error('❌ Critical error during execution:', err);
  rl.close();
});
