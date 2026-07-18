#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n🎮 Serve Android Skill Installation\n');

  const choice = await askQuestion(
    'How do you want to use the skill?\n' +
      '1. Locally in this project (recommended for single project)\n' +
      '2. Globally (use in multiple projects)\n' +
      '3. View documentation\n\n' +
      'Enter your choice (1-3): ',
  );

  rl.close();

  if (choice === '1') {
    installLocally();
  } else if (choice === '2') {
    installGlobally();
  } else if (choice === '3') {
    showDocumentation();
  } else {
    console.error('Invalid choice. Please run again and select 1, 2, or 3.');
    process.exit(1);
  }
}

function installLocally() {
  console.log('\n📦 Local Installation\n');
  console.log('To install the skill in your project, run:\n');
  console.log('  npm install @serve-android/skill\n');
  console.log('Then in your code:\n');
  console.log('  import { ServeDeviceClient } from "@serve-android/skill"');
  console.log('  const client = new ServeDeviceClient("http://localhost:3000")\n');
  console.log('✅ Local installation is ideal for:\n');
  console.log('  • Single project usage');
  console.log('  • Version management per project');
  console.log('  • Team collaboration (defined in package.json)');
  console.log('  • Different versions for different projects\n');
  showExampleLocal();
}

function installGlobally() {
  console.log('\n🌍 Global Installation\n');
  console.log('To install globally, run:\n');
  console.log('  npm install -g @serve-android/skill\n');
  console.log('Then in any project, import it:\n');
  console.log('  import { ServeDeviceClient } from "@serve-android/skill"');
  console.log('  const client = new ServeDeviceClient("http://localhost:3000")\n');
  console.log('✅ Global installation is ideal for:\n');
  console.log('  • Using across multiple projects');
  console.log('  • Quick prototyping');
  console.log('  • Command-line tools');
  console.log('  • Shared development environments\n');
  showExampleGlobal();
}

function showDocumentation() {
  console.log('\n📖 Documentation\n');
  console.log('Full guides are available at:\n');
  console.log('  • Installation: ../INSTALL_SKILL.md');
  console.log('  • API Reference: ./README.md');
  console.log('  • Publishing: ./PUBLISHING.md\n');
  console.log('📚 Key Resources:\n');
  console.log('  npm install @serve-android/skill   - Install locally');
  console.log('  npm install -g @serve-android/skill - Install globally');
  console.log('  npx serve-android                    - Start the server\n');
  console.log('🔗 Repository: https://github.com/nmiz1987/serve-device\n');
}

function showExampleLocal() {
  console.log('📝 Example: Local Installation\n');
  console.log('1. Create a new project:');
  console.log('   mkdir my-android-app && cd my-android-app\n');
  console.log('2. Initialize npm:');
  console.log('   npm init -y\n');
  console.log('3. Install the skill:');
  console.log('   npm install @serve-android/skill\n');
  console.log('4. Create index.js:');
  console.log('   cat > index.js << EOF');
  console.log('   import { ServeDeviceClient } from "@serve-android/skill"');
  console.log('   const client = new ServeDeviceClient("http://localhost:3000")');
  console.log('   const devices = await client.getDevices()');
  console.log('   console.log(devices)');
  console.log('   EOF\n');
  console.log('5. Run:');
  console.log('   node index.js\n');
}

function showExampleGlobal() {
  console.log('📝 Example: Global Installation\n');
  console.log('1. Install globally:');
  console.log('   npm install -g @serve-android/skill\n');
  console.log('2. Use in any project:');
  console.log('   cd ~/my-project');
  console.log('   npm init -y\n');
  console.log('3. Create script (index.js):');
  console.log('   cat > index.js << EOF');
  console.log('   import { ServeDeviceClient } from "@serve-android/skill"');
  console.log('   const client = new ServeDeviceClient("http://localhost:3000")');
  console.log('   const devices = await client.getDevices()');
  console.log('   console.log(devices)');
  console.log('   EOF\n');
  console.log('4. Run:');
  console.log('   node index.js\n');
  console.log('💡 Multiple projects can share the global installation!\n');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
