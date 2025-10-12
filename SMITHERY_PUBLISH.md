# 🚀 Publishing to Smithery

Your Dokploy MCP Server is ready to be published to Smithery! Follow these simple steps.

## ✅ Prerequisites (All Done!)

- [x] Code pushed to GitHub: https://github.com/huuthangntk/dokploy-mcp
- [x] Repository is public
- [x] All files committed and synced
- [x] smithery.yaml configured
- [x] package.json properly set up

## 📝 Step-by-Step Publishing Guide

### Step 1: Go to Smithery

1. Open your browser and go to: **[https://smithery.ai/new](https://smithery.ai/new)**
2. You'll see the "Publish a new server" page

### Step 2: Connect GitHub

1. Click **"Connect with GitHub"** (if not already connected)
2. Authorize Smithery to access your GitHub account
3. You should see a list of your repositories

### Step 3: Select Your Repository

1. Find and select: **`huuthangntk/dokploy-mcp`**
2. Or paste the URL: `https://github.com/huuthangntk/dokploy-mcp`
3. Click **"Continue"** or **"Import"**

### Step 4: Configure Server

Smithery should auto-detect your configuration, but verify:

- **Name**: `dokploy-mcp` ✅
- **Runtime**: `typescript` ✅ (from smithery.yaml)
- **Description**: `MCP server for Dokploy - Create, manage, and deploy applications` ✅
- **Config Schema**: Should auto-detect the `configSchema` from src/index.ts

**Configuration Fields** (Smithery will show these):
```
- dokployUrl: string (default: "https://dok.bish.one")
- apiToken: string (required)
- debug: boolean (default: false)
```

### Step 5: Publish

1. Review all settings
2. Click **"Publish"** or **"Deploy"**
3. Wait for the build to complete (usually 1-2 minutes)
4. You'll get a Smithery URL like:
   ```
   https://server.smithery.ai/@huuthangntk/dokploy-mcp/mcp
   ```

### Step 6: Get Your Smithery Server URL

After publishing, you'll receive a URL in this format:
```
https://server.smithery.ai/@huuthangntk/dokploy-mcp/mcp
```

**Save this URL!** You'll need it for your MCP configuration.

## 🔧 Update Your MCP Configuration

Once you have the Smithery URL, update your `mcp.json`:

### Option 1: With Query Parameters (Recommended)

```json
{
  "mcpServers": {
    "dokploy-mcp": {
      "type": "http",
      "url": "https://server.smithery.ai/@huuthangntk/dokploy-mcp/mcp?dokployUrl=https://dok.bish.one&apiToken=bishoneOTLRvuGdFzijbKeLPwYnKMfMVJyAMhIeNxvnYxrVDTystsNRMSakzfohCAilySAb&debug=false",
      "headers": {}
    }
  }
}
```

### Option 2: With Profile (If you create one on Smithery)

```json
{
  "mcpServers": {
    "dokploy-mcp": {
      "type": "http",
      "url": "https://server.smithery.ai/@huuthangntk/dokploy-mcp/mcp?profile=YOUR_PROFILE_ID",
      "headers": {}
    }
  }
}
```

## 🎯 After Publishing

1. **Copy the Smithery URL**
2. **Update your mcp.json** (see above)
3. **Restart Cursor**
4. **Test the connection**: "List all my Dokploy projects"

## ✅ Verification

After updating mcp.json and restarting Cursor:

- [ ] MCP server shows as "Connected" in Cursor status bar
- [ ] Can list Dokploy projects without errors
- [ ] Can create and manage resources
- [ ] No 401 authentication errors

## 🌟 Benefits of Smithery Hosting

✅ **Always Available**: No need to run locally
✅ **Auto-Updates**: Smithery pulls latest from GitHub
✅ **Better Performance**: Optimized hosting
✅ **Easy Sharing**: Anyone can use your MCP server
✅ **Registry Listed**: Appears in official MCP registry

## 🔄 Updating Your Server

To update after making changes:

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "your changes"
   git push origin main
   ```

2. Smithery will automatically detect and rebuild (or trigger manually)

3. No need to update mcp.json - URL stays the same!

## 🆘 Troubleshooting

### "Repository not found"
- Make sure the repository is **public**
- Verify GitHub connection is active

### "Build failed"
- Check GitHub Actions logs
- Verify `smithery.yaml` is correct
- Ensure `package.json` has all dependencies

### "Config schema not detected"
- Make sure `configSchema` is exported from `src/index.ts`
- Verify it's a Zod schema: `z.object({ ... })`

### Still using local server?
- Make sure mcp.json has `"type": "http"`
- URL should start with `https://server.smithery.ai/`
- Remove `"command"`, `"args"`, and `"cwd"` fields

## 📚 Additional Resources

- **Smithery Docs**: https://smithery.ai/docs
- **Your Repository**: https://github.com/huuthangntk/dokploy-mcp
- **Your Server on Smithery**: https://smithery.ai/@huuthangntk/dokploy-mcp
- **MCP Registry**: https://modelcontextprotocol.io/registry

## 🎉 That's It!

Once published, your Dokploy MCP Server will be:
- ✅ Publicly accessible
- ✅ Listed in the Smithery registry
- ✅ Available to all MCP clients
- ✅ Auto-deployed from GitHub

---

**Need Help?** Join the Smithery Discord: https://discord.gg/Afd38S5p9A

