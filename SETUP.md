# GitHub Setup Guide

This guide will help you push this Dokploy MCP Server to GitHub and make it public.

## Prerequisites

- A GitHub account
- Git installed on your system
- This project already initialized (✅ Done!)

## Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Fill in the repository details:
   - **Repository name**: `dokploy-mcp`
   - **Description**: `MCP server for Dokploy - Create, manage, and deploy applications`
   - **Visibility**: Select **Public**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
3. Click **Create repository**

## Step 2: Update Repository URL

After creating the repository, update the remote URL in `package.json`:

1. Replace `yourusername` with your actual GitHub username in:
   - `package.json` (line 29)
   - `README.md` (multiple locations)

Or run these commands (replace `YOUR_GITHUB_USERNAME`):

```bash
# Update package.json
sed -i 's/yourusername/YOUR_GITHUB_USERNAME/g' package.json

# Update README.md
sed -i 's/yourusername/YOUR_GITHUB_USERNAME/g' README.md
```

## Step 3: Add Remote and Push

```bash
# Add the GitHub repository as remote
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/dokploy-mcp.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 4: Configure Repository Settings

On GitHub, go to your repository and:

### Add Topics/Tags

1. Click on the ⚙️ icon next to "About" on the right sidebar
2. Add these topics:
   ```
   dokploy
   mcp
   model-context-protocol
   smithery
   deployment
   devops
   docker
   paas
   self-hosted
   vercel-alternative
   netlify-alternative
   heroku-alternative
   typescript
   ai
   llm
   automation
   ```
3. Click **Save changes**

### Enable Features

1. Go to **Settings** → **General**
2. Under **Features**, ensure these are enabled:
   - ✅ Issues
   - ✅ Projects
   - ✅ Wiki (optional)
   - ✅ Discussions (optional)

### Add Description and Website

1. On the main repository page, click the ⚙️ icon
2. Add:
   - **Description**: `MCP server for Dokploy - Create, manage, and deploy applications using Dokploy's powerful platform`
   - **Website**: `https://smithery.ai` (or your Dokploy instance URL)
   - **Topics**: (see above)

## Step 5: Create a Release

1. Go to **Releases** on the right sidebar
2. Click **Create a new release**
3. Fill in:
   - **Tag**: `v1.0.0`
   - **Release title**: `v1.0.0 - Initial Release`
   - **Description**: Copy from CHANGELOG.md
4. Click **Publish release**

## Step 6: Publish to Smithery

1. Go to [smithery.ai/new](https://smithery.ai/new)
2. Connect your GitHub account (if not already connected)
3. Select the `dokploy-mcp` repository
4. Configure deployment settings:
   - Runtime: TypeScript (auto-detected)
   - Config schema: Will be read from `configSchema` export
5. Click **Deploy**

## Step 7: Test Your Server

After deploying to Smithery:

1. Go to your server on Smithery
2. Configure your Dokploy credentials:
   - Dokploy URL: `https://dok.bish.one`
   - API Token: (your token)
3. Test the tools through the Smithery playground

## Verification Checklist

- [ ] Repository created on GitHub
- [ ] Code pushed to GitHub
- [ ] Repository is public
- [ ] Topics/tags added
- [ ] Description and website set
- [ ] README.md displays correctly
- [ ] LICENSE file present
- [ ] Initial release created
- [ ] Published to Smithery
- [ ] Server tested and working

## Quick Commands Reference

```bash
# Check current status
git status

# View commit history
git log --oneline

# Create a new branch
git checkout -b feature/your-feature

# Push changes
git add .
git commit -m "your message"
git push

# Update from remote
git pull origin main
```

## Need Help?

- **Git Issues**: [git-scm.com/doc](https://git-scm.com/doc)
- **GitHub Help**: [docs.github.com](https://docs.github.com)
- **Smithery Support**: [discord.gg/Afd38S5p9A](https://discord.gg/Afd38S5p9A)

---

**Next Steps**: After completing this setup, update your README.md with actual links and screenshots!

