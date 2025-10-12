# Dokploy MCP Server

<div align="center">

![Dokploy Logo](https://avatars.githubusercontent.com/u/155137478?s=200&v=4)

**A powerful MCP server for managing Dokploy deployments**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io/)
[![Smithery](https://img.shields.io/badge/Smithery-Ready-green.svg)](https://smithery.ai/)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [API Reference](#api-reference) • [Contributing](#contributing)

</div>

---

## 🚀 Overview

**Dokploy MCP Server** is a comprehensive Model Context Protocol (MCP) server that provides seamless integration with [Dokploy](https://dokploy.com) - the open-source alternative to Netlify, Vercel, and Heroku. This server enables AI assistants and applications to interact with Dokploy's powerful deployment platform through a standardized interface.

### What is Dokploy?

Dokploy is a free, self-hostable Platform as a Service (PaaS) that simplifies application deployment and management. It provides:
- Docker-based deployments
- Support for multiple frameworks and languages
- Automatic SSL certificates
- Database management
- Domain configuration
- And much more!

## ✨ Features

### 🗂️ Project Management
- Create, list, and delete projects
- Organize applications by project
- Manage project-level configurations

### 📦 Application Deployment
- Deploy applications from Git repositories (GitHub, GitLab, etc.)
- Support for Docker and Docker Compose
- Start, stop, and restart applications
- Real-time deployment status
- Update environment variables
- Application monitoring and health checks

### 🗄️ Database Management
- Support for multiple database types:
  - PostgreSQL
  - MySQL
  - MongoDB
  - Redis
  - MariaDB
- Create and manage databases
- Connection string management

### 🌐 Domain & SSL Management
- Add custom domains to applications
- Automatic SSL certificate provisioning via Let's Encrypt
- Domain verification and configuration

### 💾 Backup & Restore
- Create manual and scheduled backups
- List available backups
- Restore databases from backups
- Disaster recovery support

### 📊 Monitoring & Logs
- Real-time application logs
- Application status monitoring
- Performance metrics
- Error tracking

### 📚 Documentation Resources
- Built-in documentation access
- Quick start guides
- API reference
- Best practices

### 🤖 Interactive Prompts
- Guided deployment workflows
- Database setup assistance
- Troubleshooting helpers

## 📋 Prerequisites

- **Dokploy Instance**: A running Dokploy instance (self-hosted or cloud)
- **API Token**: Authentication token from your Dokploy dashboard
- **Node.js**: Version 18 or higher
- **Bun** (optional): For faster package management

## 🔧 Installation

### Quick Start with Smithery

```bash
# Install via Smithery
npx create-smithery dokploy-mcp
cd dokploy-mcp
```

### Installing via Smithery

To install Dokploy Deployments automatically via [Smithery](https://smithery.ai/server/@huuthangntk/dokploy-mcp):

```bash
npx -y @smithery/cli install @huuthangntk/dokploy-mcp
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dokploy-mcp.git
cd dokploy-mcp

# Install dependencies (with bun)
bun install

# Or with npm
npm install
```

## ⚙️ Configuration

Create a configuration file or set environment variables:

```yaml
# smithery.yaml
dokployUrl: "https://dok.bish.one"  # Your Dokploy instance URL
apiToken: "your-api-token-here"     # Your Dokploy API token
debug: false                         # Enable debug logging
```

### Getting Your API Token

1. Log in to your Dokploy dashboard
2. Navigate to Settings → API Tokens
3. Generate a new token
4. Copy and save it securely

## 🚦 Usage

### Starting the Server

```bash
# Development mode
bun run dev

# Or with npm
npm run dev
```

The server will start on `http://localhost:3000` by default.

### Example Operations

#### Deploy an Application

```typescript
// 1. Create a project
await createProject({
  name: "my-awesome-project",
  description: "My first Dokploy project"
})

// 2. Create an application
await createApplication({
  projectId: "project-id",
  name: "my-app",
  appType: "github",
  repository: "https://github.com/username/repo",
  branch: "main"
})

// 3. Deploy the application
await deployApplication({
  applicationId: "app-id"
})
```

#### Manage Databases

```typescript
// Create a PostgreSQL database
await createDatabase({
  projectId: "project-id",
  name: "my-database",
  type: "postgres",
  username: "admin",
  password: "secure-password"
})

// Create a backup
await createBackup({
  databaseId: "database-id"
})
```

#### Monitor Applications

```typescript
// Get application status
await getApplicationStatus({
  applicationId: "app-id"
})

// View recent logs
await getLogs({
  applicationId: "app-id",
  lines: 100
})
```

## 📖 API Reference

### Tools

#### Project Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `list-projects` | List all projects | None |
| `create-project` | Create a new project | `name`, `description` |
| `delete-project` | Delete a project | `projectId` |

#### Application Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `list-applications` | List all applications | `projectId` |
| `create-application` | Create a new application | `projectId`, `name`, `appType`, `repository`, etc. |
| `deploy-application` | Deploy an application | `applicationId` |
| `start-application` | Start an application | `applicationId` |
| `stop-application` | Stop an application | `applicationId` |
| `restart-application` | Restart an application | `applicationId` |
| `delete-application` | Delete an application | `applicationId` |
| `get-logs` | Get application logs | `applicationId`, `lines` |
| `get-application-status` | Get application status | `applicationId` |
| `update-env-vars` | Update environment variables | `applicationId`, `env` |

#### Database Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `create-database` | Create a new database | `projectId`, `name`, `type`, etc. |
| `list-databases` | List all databases | `projectId` |

#### Domain Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `add-domain` | Add a custom domain | `applicationId`, `domain`, `enableSSL` |
| `list-domains` | List all domains | `applicationId` |

#### Backup & Restore

| Tool | Description | Parameters |
|------|-------------|------------|
| `create-backup` | Create a database backup | `databaseId` |
| `list-backups` | List all backups | `databaseId` |
| `restore-backup` | Restore from backup | `backupId` |

### Resources

- `dokploy://docs` - Complete Dokploy documentation
- `dokploy://quickstart` - Quick start guide
- `dokploy://api-reference` - API reference

### Prompts

- `deploy-app` - Guided application deployment
- `setup-database` - Guided database setup
- `troubleshoot` - Application troubleshooting assistant

## 🔐 Security

- **API Token**: Store your API token securely. Never commit it to version control.
- **HTTPS**: Always use HTTPS for production deployments
- **Environment Variables**: Use environment variables for sensitive data
- **Access Control**: Configure proper access controls in your Dokploy instance

## 🛠️ Development

### Project Structure

```
dokploy-mcp/
├── src/
│   └── index.ts          # Main server implementation
├── package.json          # Project dependencies
├── smithery.yaml         # Runtime configuration
├── README.md            # This file
└── .gitignore           # Git ignore rules
```

### Building for Production

```bash
# Build the server
bun run build

# Or with npm
npm run build
```

### Testing

```bash
# Run the development server
bun run dev

# Test with curl
curl -X POST "http://127.0.0.1:3000/mcp?dokployUrl=https://dok.bish.one&apiToken=your-token" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```

## 🚢 Deployment

### Deploy to Smithery

1. Push your code to GitHub
2. Visit [smithery.ai/new](https://smithery.ai/new)
3. Connect your repository
4. Configure your Dokploy credentials
5. Deploy!

### Deploy to Your Own Infrastructure

```bash
# Build the project
bun run build

# Run the server
PORT=3000 node dist/index.js
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Dokploy](https://dokploy.com) - The amazing PaaS platform
- [Smithery](https://smithery.ai) - MCP server hosting and registry
- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol that makes this possible
- [Anthropic](https://www.anthropic.com/) - For creating the MCP standard

## 📞 Support

- **Documentation**: [docs.dokploy.com](https://docs.dokploy.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/dokploy-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/dokploy-mcp/discussions)
- **Dokploy Discord**: Join the Dokploy community
- **Smithery Discord**: [discord.gg/Afd38S5p9A](https://discord.gg/Afd38S5p9A)

## 🗺️ Roadmap

- [ ] Add support for Docker Compose deployments
- [ ] Implement real-time deployment progress tracking
- [ ] Add metrics and analytics integration
- [ ] Support for custom build scripts
- [ ] Multi-region deployment support
- [ ] Advanced monitoring and alerting
- [ ] Integration with CI/CD pipelines
- [ ] Webhook support for automated deployments

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/dokploy-mcp?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/dokploy-mcp?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/dokploy-mcp?style=social)

---

<div align="center">

Made with ❤️ by the Dokploy community

**[⬆ back to top](#dokploy-mcp-server)**

</div>

