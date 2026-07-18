# Serve Android Skill - Installation Options

Choose how you want to install the Serve Android Skill based on your needs.

## Quick Decision Guide

| Scenario | Recommendation |
|----------|---|
| Using in one project | **Local** |
| Using across multiple projects | **Global** |
| Team collaboration | **Local** (commit to package.json) |
| Quick prototyping | **Global** |
| CI/CD pipelines | **Local** (reproducible) |
| Command-line automation | **Global** |

## Option 1: Local Installation (Recommended)

Install the skill as a dependency in your project.

### Installation

```bash
npm install @serve-android/skill
```

### Usage

```typescript
import { ServeDeviceClient } from '@serve-android/skill'

const client = new ServeDeviceClient('http://localhost:3000')
const devices = await client.getDevices()
```

### Pros
✅ Project-specific version control  
✅ Easy to share (package.json is version controlled)  
✅ Multiple projects can use different versions  
✅ CI/CD pipelines always use the same version  
✅ Easier for team collaboration  
✅ Clear dependency declaration  

### Cons
❌ Need to install for each project  
❌ Uses disk space in each project  

### Best For
- Production applications
- Team projects
- CI/CD pipelines
- Projects with strict version management

### Example Project Structure

```
my-project/
├── package.json          # Contains "@serve-android/skill": "^0.1.0"
├── node_modules/
│   └── @serve-android/skill/
├── index.js
└── README.md
```

---

## Option 2: Global Installation

Install the skill globally on your system.

### Installation

```bash
npm install -g @serve-android/skill
```

### Usage

```typescript
import { ServeDeviceClient } from '@serve-android/skill'

const client = new ServeDeviceClient('http://localhost:3000')
const devices = await client.getDevices()
```

### Pros
✅ One installation for all projects  
✅ Saves disk space  
✅ Quick setup for new projects  
✅ Great for prototyping  
✅ Can use from command line: `serve-android-skill`

### Cons
❌ Different projects might use different versions  
❌ Hard to track exact version used  
❌ Not ideal for team collaboration  
❌ CI/CD needs special handling  

### Best For
- Personal projects
- Quick prototyping
- Command-line scripts
- Learning and experimentation

### Accessing Globally Installed Skill

From anywhere:

```bash
# Run the skill setup guide
serve-android-skill

# Use in any project without installation
import { ServeDeviceClient } from '@serve-android/skill'
```

---

## Installation Setup Guide

When you first install the skill, run:

```bash
# For local installation
npx @serve-android/skill

# For global installation
serve-android-skill
```

This opens an interactive guide to help you choose the best installation method.

---

## Switching Between Installation Methods

### From Local to Global

```bash
# Uninstall from project
npm uninstall @serve-android/skill

# Install globally
npm install -g @serve-android/skill
```

### From Global to Local

```bash
# Uninstall from global
npm uninstall -g @serve-android/skill

# Install in your project
npm install @serve-android/skill
```

---

## Version Management

### Check Installed Versions

```bash
# Check project version
npm list @serve-android/skill

# Check global version
npm list -g @serve-android/skill
```

### Update Skills

```bash
# Update local installation
npm update @serve-android/skill

# Update global installation
npm update -g @serve-android/skill

# Update to specific version
npm install @serve-android/skill@0.2.0
npm install -g @serve-android/skill@0.2.0
```

### Pin Version (Local Only)

In `package.json`:

```json
{
  "dependencies": {
    "@serve-android/skill": "0.1.0"    // Exact version
  }
}
```

---

## Using in Different Contexts

### NPX (No Installation)

```bash
# Use without installing
npx @serve-android/skill

# Shows installation options and documentation
```

### Node.js Script

**Local:**
```typescript
import { ServeDeviceClient } from '@serve-android/skill'
const client = new ServeDeviceClient('http://localhost:3000')
```

**Global:**
```typescript
import { ServeDeviceClient } from '@serve-android/skill'
const client = new ServeDeviceClient('http://localhost:3000')
```

### CLI Tool

```bash
# Global installation provides CLI
serve-android-skill

# Shows interactive menu for:
# - Local installation instructions
# - Global installation instructions
# - Documentation links
# - Quick examples
```

---

## CI/CD Integration

### GitHub Actions (Recommended: Local)

```yaml
- name: Install dependencies
  run: npm ci

# @serve-android/skill is installed from package-lock.json
```

### Docker (Recommended: Local)

```dockerfile
FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm ci

# @serve-android/skill is installed
COPY . .
CMD ["node", "index.js"]
```

### Global Installation in CI/CD

```yaml
- name: Install Serve Android Skill
  run: npm install -g @serve-android/skill

- name: Run script
  run: node index.js
```

---

## Troubleshooting

### "Cannot find module '@serve-android/skill'"

**Local installation**: Make sure you ran `npm install @serve-android/skill`

```bash
npm install @serve-android/skill
npm list @serve-android/skill  # Verify installation
```

**Global installation**: Make sure you ran `npm install -g @serve-android/skill`

```bash
npm install -g @serve-android/skill
npm list -g @serve-android/skill  # Verify installation
```

### Different versions in different projects

Use local installation for each project:

```bash
cd project-a
npm install @serve-android/skill@0.1.0

cd project-b
npm install @serve-android/skill@0.2.0
```

### Global installation not working

Verify npm global path:

```bash
npm list -g @serve-android/skill

# If not found, reinstall
npm install -g @serve-android/skill
```

### Permission denied (macOS/Linux)

Use `sudo` for global installation:

```bash
sudo npm install -g @serve-android/skill
```

Or configure npm to use a different directory:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

---

## Next Steps

After installation:

1. **Start Serve Android Server**
   ```bash
   npx serve-android
   ```

2. **Use in Your Project**
   ```typescript
   import { ServeDeviceClient } from '@serve-android/skill'
   const client = new ServeDeviceClient('http://localhost:3000')
   ```

3. **Read Full Documentation**
   - [Installation Guide](../INSTALL_SKILL.md)
   - [API Reference](README.md)
   - [Publishing Guide](PUBLISHING.md)

---

## FAQ

**Q: Can I use both local and global installations?**
A: Yes, they don't conflict. The local version takes precedence in your project.

**Q: Which version am I using?**
A: Local takes precedence. Check with `npm list @serve-android/skill`.

**Q: Can I downgrade/upgrade easily?**
A: Yes, with `npm install @serve-android/skill@VERSION`.

**Q: Is global installation safe?**
A: Yes, global installations don't affect system files or other applications.

**Q: Should I commit node_modules to git?**
A: No, commit package.json and package-lock.json. Run `npm ci` to install.

---

## Support

For issues:
- 🐛 [GitHub Issues](https://github.com/nmiz1987/serve-device/issues)
- 📖 [Full Documentation](README.md)
- 💬 [Discussions](https://github.com/nmiz1987/serve-device/discussions)
