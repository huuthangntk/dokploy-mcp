# 🔐 Dokploy MCP Authentication Setup

This guide will help you set up authentication for your Dokploy MCP Server.

## 🎯 Quick Fix

**The 401 Unauthorized error** means your Dokploy API token isn't configured yet. Let's fix that!

## Step 1: Get Your Dokploy API Token

### Option A: Via Dokploy Web Interface

1. **Open your Dokploy instance**: https://dok.bish.one
2. **Log in** with your credentials
3. **Navigate to Settings**:
   - Click on your profile/avatar (usually top-right)
   - Look for "Settings", "Account Settings", or "Profile"
4. **Find API Tokens section**:
   - Look for "API Tokens", "Access Tokens", or "API Keys"
   - May be under "Security", "Developer", or "Integration"
5. **Generate a new token**:
   - Click "Create Token", "Generate Token", or "New API Key"
   - Give it a descriptive name like "MCP Server"
   - Set appropriate permissions (usually "Full Access" or "Admin")
   - **Copy the token immediately** - you won't be able to see it again!

### Option B: Via Dokploy API (if available)

```bash
curl -X POST https://dok.bish.one/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

## Step 2: Configure the Token

### ✅ Your `mcp.json` is Already Updated!

I've already added the Dokploy MCP configuration to your `mcp.json` file. Now you just need to replace the placeholder with your actual token:

**File**: `C:\Users\Yomen\.cursor\mcp.json`

**Look for** (line 46):
```json
"DOKPLOY_API_TOKEN": "YOUR_DOKPLOY_API_TOKEN_HERE"
```

**Replace with** your actual token:
```json
"DOKPLOY_API_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
```

### Example Configuration

After editing, your dokploy-mcp section should look like this:

```json
"dokploy-mcp": {
  "command": "bun",
  "args": [
    "run",
    "dev"
  ],
  "cwd": "c:\\Users\\Yomen\\dokploy mcp",
  "env": {
    "DOKPLOY_URL": "https://dok.bish.one",
    "DOKPLOY_API_TOKEN": "actual-token-from-dokploy-here"
  }
}
```

## Step 3: Restart Cursor

After updating the `mcp.json` file:

1. **Save the file** (Ctrl+S)
2. **Restart Cursor** completely
3. **Wait for MCP servers to connect** (check the bottom status bar)

## Step 4: Test the Connection

Once Cursor restarts, try these commands:

```
List all my projects
```

or

```
Show my Dokploy projects
```

If it works, you should see a list of your projects! 🎉

## 🔍 Troubleshooting

### Still Getting 401 Unauthorized?

**Check 1: Token is Correct**
```bash
# Test the token directly with curl
curl -X GET "https://dok.bish.one/api/project.all" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

If this returns 401, your token is invalid or expired.

**Check 2: Token Has Correct Permissions**
- Make sure the token has API access enabled
- Some Dokploy instances require specific scopes/permissions

**Check 3: Dokploy Instance is Accessible**
```bash
# Check if your Dokploy instance is accessible
curl https://dok.bish.one/api/health
```

**Check 4: MCP Server is Running**
- Look for "dokploy-mcp" in Cursor's MCP status (bottom bar)
- Should show "Connected" or similar status

### Other Common Issues

#### 🔴 "Command 'bun' not found"

If you get this error, change the mcp.json configuration to use npm instead:

```json
"dokploy-mcp": {
  "command": "npm",
  "args": [
    "run",
    "dev"
  ],
  "cwd": "c:\\Users\\Yomen\\dokploy mcp",
  "env": {
    "DOKPLOY_URL": "https://dok.bish.one",
    "DOKPLOY_API_TOKEN": "your-token-here"
  }
}
```

#### 🔴 "Failed to start MCP server"

1. Make sure you're in the correct directory
2. Run `bun install` to ensure dependencies are installed
3. Test the server manually:
   ```bash
   cd "c:\Users\Yomen\dokploy mcp"
   bun run dev
   ```

#### 🔴 "Cannot find module"

Install dependencies:
```bash
cd "c:\Users\Yomen\dokploy mcp"
bun install
```

## 📝 Token Security Best Practices

✅ **DO:**
- Store tokens in environment variables or secure config files
- Generate separate tokens for different applications
- Rotate tokens regularly
- Set appropriate permissions/scopes

❌ **DON'T:**
- Commit tokens to version control
- Share tokens publicly
- Use the same token across multiple applications
- Give tokens more permissions than needed

## 🔄 Alternative: Using Query Parameters

If environment variables don't work, you can also use URL query parameters (less secure):

```json
"dokploy-mcp": {
  "type": "http",
  "url": "http://localhost:3000/mcp?dokployUrl=https://dok.bish.one&apiToken=YOUR_TOKEN",
  "headers": {}
}
```

**Note**: This requires the server to be running separately:
```bash
cd "c:\Users\Yomen\dokploy mcp"
bun run dev
```

## 📚 API Token Reference

### Token Format
Dokploy API tokens typically look like:
- JWT tokens: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- API keys: `dk_live_xxxxxxxxxxxxxxxxxxxxx`
- Random strings: `f8e7d6c5b4a3...`

### Token Permissions
Make sure your token has these permissions:
- ✅ Read projects
- ✅ Create/update/delete projects
- ✅ Read/write applications
- ✅ Manage databases
- ✅ Configure domains
- ✅ Access logs

## 🆘 Need More Help?

### Check Dokploy Documentation
- Official docs: https://docs.dokploy.com
- API reference: https://dok.bish.one/swagger
- GitHub: https://github.com/dokploy/dokploy

### Check MCP Configuration
- Cursor MCP docs: [Cursor MCP Documentation]
- Smithery docs: https://smithery.ai/docs

### Common Dokploy Endpoints
```bash
# Health check
GET https://dok.bish.one/api/health

# List projects (requires auth)
GET https://dok.bish.one/api/project.all
Authorization: Bearer YOUR_TOKEN

# Get user info (requires auth)
GET https://dok.bish.one/api/user.me
Authorization: Bearer YOUR_TOKEN
```

## ✅ Verification Checklist

Once configured, verify everything works:

- [ ] API token obtained from Dokploy
- [ ] `mcp.json` updated with token
- [ ] Cursor restarted
- [ ] MCP server shows as "Connected"
- [ ] Can list projects without 401 error
- [ ] Can create new projects
- [ ] Can deploy applications

## 🎉 Success!

Once you see your projects list without errors, you're all set! You can now:

- ✅ Manage projects
- ✅ Deploy applications
- ✅ Create databases
- ✅ Configure domains
- ✅ View logs and monitoring
- ✅ Backup and restore

Enjoy your Dokploy MCP Server! 🚀

---

**Last Updated**: October 12, 2025  
**Version**: 1.0.0

