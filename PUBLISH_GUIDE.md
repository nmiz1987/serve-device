# Publishing Serve Android to npm

Complete guide to publish both the main CLI and the skill SDK to npm.

## Prerequisites

1. ✅ **npm Account**
   - Create at https://www.npmjs.com/signup
   - Verify your email

2. ✅ **npm Login**
   ```bash
   npm login
   npm whoami  # Verify you're logged in
   ```

## What Gets Published

### 1. Main Package: `serve-android`
- CLI tool to start the server
- Built server (dist/)
- Built client UI (dist/)
- One-command startup: `npx serve-android`

### 2. Skill Package: `@serve-android/skill`
- TypeScript SDK for developers
- Device control API
- Full documentation
- Installation: `npm install @serve-android/skill`

---

## Publishing Steps

### Step 1: Verify Your Repository

Check that GitHub repository is correctly set up:

```bash
# Verify repository URLs
grep -r "nmiz1987/serve-device" *.json skill/package.json

# Should see:
# "url": "https://github.com/nmiz1987/serve-device"
```

### Step 2: Build Both Packages

```bash
# Build everything
npm run build

# Verify builds succeeded
ls server/dist/main.js
ls client/dist/index.html
```

### Step 3: Test Skill Package Locally

```bash
# Link skill locally
cd skill
npm link

# In another directory, test it
mkdir test-skill
cd test-skill
npm link @serve-android/skill

# Create test file
cat > test.js << 'EOF'
import { ServeDeviceClient } from '@serve-android/skill'
console.log('✅ Skill package works!')
EOF

# Test
node test.js

# Unlink
npm unlink @serve-android/skill
cd ..
rm -rf test-skill
```

### Step 4: Publish Skill Package First

Publish the skill package to npm:

```bash
cd skill

# Verify package.json is correct
cat package.json | grep -A 2 '"name"'
# Should show: "@serve-android/skill"

# Publish (scoped package requires --access public)
npm publish --access public

# Verify on npm
npm view @serve-android/skill
# Should show version 0.1.0
```

**Expected output:**
```
npm notice
npm notice 📦  @serve-android/skill@0.1.0
npm notice === Tarball Contents ===
npm notice 167B   package.json
npm notice 5.7kB  README.md
npm notice 3.2kB  bin/serve-android-skill.js
npm notice 12.4kB dist/index.js
npm notice 2.8kB  dist/index.d.ts
npm notice === Tarball Details ===
npm notice name:          @serve-android/skill
npm notice version:       0.1.0
npm notice filename:      serve-android-skill-0.1.0.tgz
npm notice published:     [date]
npm notice public:        yes
```

### Step 5: Test Skill Package from npm

```bash
# Clear npm cache
npm cache clean --force

# Test installation
mkdir test-npm-skill
cd test-npm-skill
npm init -y
npm install @serve-android/skill

# Test import
cat > test.js << 'EOF'
import { ServeDeviceClient } from '@serve-android/skill'
const client = new ServeDeviceClient('http://localhost:3000')
console.log('✅ Imported successfully from npm!')
console.log('Client URL:', client.constructor.name)
EOF

node test.js

# Cleanup
cd ..
rm -rf test-npm-skill
```

### Step 6: Publish Main Package

Publish the main CLI package:

```bash
cd ..  # Back to project root

# Verify package.json
cat package.json | grep '"name"'
# Should show: "serve-android"

# Publish
npm publish

# Verify
npm view serve-android
# Should show version 0.1.0
```

### Step 7: Test Main Package from npm

```bash
# Test CLI
npx serve-android --help

# Or start it
npx serve-android
# Should show: 🎮 Starting Serve Android...
# Press Ctrl+C to stop
```

### Step 8: Create GitHub Release

Tag and release on GitHub:

```bash
# Create annotated tag
git tag -a v0.1.0 -m "Initial release: Serve Android CLI and Skill SDK"

# Push tag to GitHub
git push origin v0.1.0

# Or create release on GitHub web UI:
# https://github.com/nmiz1987/serve-device/releases/new
```

---

## Verification Checklist

After publishing, verify everything works:

### ✅ Skill Package

```bash
# Should work
npx @serve-android/skill

# Should show interactive menu
echo "3" | npx @serve-android/skill | head -5

# Should show documentation
npm view @serve-android/skill
npm view @serve-android/skill readme | head -20
```

### ✅ Main Package

```bash
# Should work
npx serve-android

# Test locally first (in background)
npx serve-android &
sleep 5
curl http://localhost:3000/api/devices
pkill -f serve-android
```

### ✅ Installation Methods

```bash
# Test local installation
mkdir test-local
cd test-local
npm init -y
npm install @serve-android/skill
node -e "import('@serve-android/skill').then(() => console.log('✅ Works!'))"
cd ..
rm -rf test-local

# Test global installation
npm install -g @serve-android/skill
npm list -g @serve-android/skill
serve-android-skill
npm uninstall -g @serve-android/skill
```

---

## Troubleshooting

### "404 Not Found" when installing

**Solution:** Package hasn't been published yet. Follow publishing steps above.

```bash
npm view @serve-android/skill
# If you see: "error code E404", package isn't published yet
```

### "You must be logged in to publish"

**Solution:** Login to npm first

```bash
npm login
npm whoami  # Should show your username
```

### "Package name already exists"

**Solution:** The package name is taken. Use a different name:

```bash
# Option 1: Scoped package (recommended)
# Change in package.json:
{
  "name": "@yourusername/serve-android"
}

# Option 2: Unscoped with suffix
{
  "name": "serve-android-cli"
}
```

### "Permission denied" on publishing

**Solution:** You don't have publish permissions

```bash
# Check npm user
npm whoami

# Verify you own the package
npm owner ls @serve-android/skill

# If not owner, contact package maintainer
```

### Build failed before publishing

**Solution:** Rebuild everything

```bash
# Clean builds
rm -rf server/dist client/dist

# Rebuild
npm run build

# Verify
ls server/dist/main.js
ls client/dist/index.html
```

---

## Version Updates (Future Releases)

After initial release, for updates:

### Patch Update (0.1.0 → 0.1.1)
```bash
# Bump version in all packages
npm version patch

# Publish skill
cd skill
npm publish --access public
cd ..

# Publish main
npm publish

# Create GitHub tag
git push origin v0.1.1
```

### Minor Update (0.1.0 → 0.2.0)
```bash
npm version minor
# ... rest is same as patch
```

### Major Update (0.1.0 → 1.0.0)
```bash
npm version major
# ... rest is same as patch
```

---

## What Users See

### After Publishing

Users can now use Serve Android in three ways:

**1. CLI (Everyone)**
```bash
npx serve-android
# Starts server on http://localhost:3000
```

**2. Skill - Local Installation**
```bash
npm install @serve-android/skill
import { ServeDeviceClient } from '@serve-android/skill'
```

**3. Skill - Global Installation**
```bash
npm install -g @serve-android/skill
# Then use in any project
import { ServeDeviceClient } from '@serve-android/skill'
```

---

## Publishing Timeline

1. **~5 min**: Publish @serve-android/skill
2. **~1 min**: Publish serve-android
3. **~2 min**: Verify both packages
4. **~1 min**: Create GitHub release

**Total: ~9 minutes to make your package live for the world! 🚀**

---

## Support & Resources

- **npm Package Pages:**
  - Main: https://www.npmjs.com/package/serve-android
  - Skill: https://www.npmjs.com/package/@serve-android/skill

- **GitHub:**
  - Repository: https://github.com/nmiz1987/serve-device
  - Releases: https://github.com/nmiz1987/serve-device/releases

- **Documentation:**
  - Installation: INSTALL_SKILL.md
  - Publishing: skill/PUBLISHING.md
  - Options: skill/INSTALLATION_OPTIONS.md

---

## After Publishing Checklist

- [ ] Both packages published to npm
- [ ] GitHub tags created (v0.1.0)
- [ ] GitHub release created
- [ ] Tested `npx serve-android`
- [ ] Tested `npm install @serve-android/skill`
- [ ] Updated social media/announcements
- [ ] Notified interested users

**You're ready to go live! 🎉**
