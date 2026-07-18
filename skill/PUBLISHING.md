# Publishing @serve-android/skill to npm

This guide explains how to publish the Serve Android Skill package to npm.

## Prerequisites

1. **npm Account**: Create one at https://www.npmjs.com/signup
2. **npm Login**:
   ```bash
   npm login
   ```

## Publishing Steps

### Step 1: Verify Package Details

Check that `skill/package.json` has:
- ✅ Correct name: `@serve-android/skill`
- ✅ Version number (increment if re-publishing)
- ✅ Description, license, repository fields
- ✅ Main entry point: `dist/index.js`
- ✅ TypeScript definitions in exports

```bash
# From the skill directory
cd skill
cat package.json
```

### Step 2: Build the Package

```bash
# From project root
cd skill
npm run build
```

This compiles TypeScript to JavaScript in `skill/dist/`.

### Step 3: Test Locally (Optional)

```bash
# From skill directory
npm link

# In another project, test the installation
npm link @serve-android/skill

# Use it in your code
import { ServeDeviceClient } from '@serve-android/skill'
```

### Step 4: Publish to npm

```bash
# From skill directory
npm publish

# For scoped packages (@user/package), use:
npm publish --access public
```

### Step 5: Verify Publication

```bash
# Check on npm
npm view @serve-android/skill

# Or visit
# https://www.npmjs.com/package/@serve-android/skill
```

## Installation for Users

After publishing, developers can install with:

```bash
npm install @serve-android/skill
```

## Version Updates

For subsequent releases:

```bash
# Increment version
npm version patch   # v0.1.0 → v0.1.1
npm version minor   # v0.1.0 → v0.2.0
npm version major   # v0.1.0 → v1.0.0

# Publish new version
npm publish
```

## Unpublishing

If you need to unpublish a version (not recommended):

```bash
npm unpublish @serve-android/skill@0.1.0 --force
```

## What Gets Published

When you publish, npm includes:
- ✅ `dist/` - Compiled JavaScript
- ✅ `dist/index.d.ts` - TypeScript definitions
- ✅ `package.json` - Package metadata
- ✅ `README.md` - Documentation
- ✅ `LICENSE` - License file

Files excluded via `.npmignore`:
- ❌ `src/` - Source TypeScript files
- ❌ `tsconfig.json` - TypeScript config
- ❌ `.vscode/`, `.idea/` - Editor configs

## Publishing Scoped vs Unscoped

### Scoped Package (Recommended)
```json
{
  "name": "@serve-android/skill"
}
```
Publish as:
```bash
npm publish --access public
```

### Unscoped Package
```json
{
  "name": "serve-android-skill"
}
```
Publish as:
```bash
npm publish
```

## Troubleshooting

### "You must be logged in"
```bash
npm login
npm whoami  # Verify login
```

### "Package name already exists"
- Choose a different scoped name: `@your-username/serve-android-skill`
- Or use unscoped: `serve-android-skill`

### "Permission denied"
- Ensure you have publish permissions on the npm package
- Check your npm token: `npm token list`

### Build fails
```bash
# Clean and rebuild
rm -rf dist/
npm run build

# Check TypeScript errors
npm run type-check
```

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci --cwd skill
      
      - name: Build
        run: npm run build --cwd skill
      
      - name: Publish to npm
        run: npm publish --cwd skill
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Documentation

When publishing, make sure users can find:
1. **Main README**: `skill/README.md` - Full API reference
2. **Installation Guide**: Root `INSTALL_SKILL.md` - Getting started
3. **Examples**: Code samples for common use cases
4. **GitHub Issues**: Link to report bugs

## Support

For questions about npm publishing:
- [npm CLI Docs](https://docs.npmjs.com/cli)
- [Publishing Packages](https://docs.npmjs.com/packages-and-modules/publishing-a-package)
- [Scoped Packages](https://docs.npmjs.com/about/scoped-packages)
