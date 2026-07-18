# Publishing Guide

This guide will help you publish Serve Android to npm.

## Prerequisites

1. **npm Account**: Create one at https://www.npmjs.com/signup
2. **Login to npm**:
   ```bash
   npm login
   ```
3. **Update Repository URLs**: Replace `your-username` in package.json files:
   ```bash
   find . -name package.json -exec sed -i '' 's|your-username|YOUR_GITHUB_USERNAME|g' {} \;
   ```

## Publishing Steps

### 1. Update Version (Optional)
If this is not the first release, update the version in all `package.json` files:
```bash
# Update root and workspace versions
npm version patch  # or minor/major
```

### 2. Create GitHub Release
```bash
git tag -a v0.1.0 -m "Initial release - Serve Android CLI"
git push --tags
```

### 3. Publish to npm

Publish the main package:
```bash
npm publish
```

Publish the skill package (optional, if you want the AI skill separately):
```bash
cd skill
npm publish
```

### 4. Verify Installation
Test the CLI works:
```bash
# Using npm
npx serve-android

# Using bun
bunx serve-android
```

## What Gets Published

### Main Package (`serve-android`)
- CLI entrypoint at `/bin/serve-android.js`
- Server build output (`server/dist/`)
- Client build output (`client/dist/`)
- Shared utilities

### Skill Package (`@serve-android/skill`)
- TypeScript SDK for AI agents
- Published separately for specialized use

## Unpublishing

If you need to unpublish (not recommended):
```bash
npm unpublish serve-android@0.1.0 --force
```

## Updates and Maintenance

For future releases:
1. Update `CHANGELOG.md` with changes
2. Bump version: `npm version minor`
3. Publish: `npm publish`

## Troubleshooting

### Package name taken
If `serve-android` is taken, use a scoped package:
```json
{
  "name": "@your-username/serve-android"
}
```

And publish as:
```bash
npm publish --access public
```

### Build fails during installation
Ensure `bun` is installed as a peer dependency or document it in README.md

### Large package size
If the package is too large:
- Update `.npmignore` to exclude more files
- Remove unnecessary dependencies
- Consider publishing only the CLI wrapper

## Support

For issues or questions:
1. Check GitHub Issues: https://github.com/your-username/serve-android/issues
2. Review npm package page: https://www.npmjs.com/package/serve-android
