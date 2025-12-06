/**
 * Dokploy MCP Server
 * 
 * An MCP server that provides comprehensive integration with Dokploy,
 * allowing you to create, manage, deploy, and monitor applications
 * through Dokploy's powerful platform.
 * 
 * Features:
 * - Project management (create, list, update, delete)
 * - Application deployment (create, deploy, update, stop, start)
 * - Database management (PostgreSQL, MySQL, MongoDB, Redis)
 * - Domain and SSL management
 * - Backup and restore operations
 * - Service monitoring and logs
 * - Documentation search
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

// Configuration schema for Dokploy connection
export const configSchema = z.object({
	dokployUrl: z.string()
		.url()
		.default(process.env.DOKPLOY_URL || "https://dok.bish.one")
		.describe("Your Dokploy instance URL (e.g., https://dok.bish.one)"),
	apiToken: z.string()
		.default(process.env.DOKPLOY_API_TOKEN || "")
		.describe("Your Dokploy API authentication token"),
	debug: z.boolean()
		.default(process.env.DEBUG === "true" || false)
		.describe("Enable debug logging for troubleshooting"),
})

// Helper function to make API requests
async function dokployRequest(
	config: z.infer<typeof configSchema>,
	endpoint: string,
	method: string = "GET",
	body?: any
): Promise<any> {
	const url = `${config.dokployUrl}/api${endpoint}`
	
	if (config.debug) {
		console.log(`[Dokploy API] ${method} ${url}`)
	}

	try {
		const response = await fetch(url, {
			method,
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
				"x-api-key": config.apiToken,
			},
			body: body ? JSON.stringify(body) : undefined,
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`Dokploy API error (${response.status}): ${errorText}`)
		}

		const data = await response.json()
		return data
	} catch (error) {
		if (config.debug) {
			console.error(`[Dokploy API Error]`, error)
		}
		throw error
	}
}

export default function createServer({
	config,
}: {
	config: z.infer<typeof configSchema>
}) {
	// Validate API token is provided
	if (!config.apiToken) {
		console.error("❌ DOKPLOY_API_TOKEN environment variable is not set!")
		console.error("Please set your Dokploy API token in the environment variables.")
		console.error("Example: DOKPLOY_API_TOKEN=your-token-here")
	}

	const server = new McpServer({
		name: "Dokploy MCP Server",
		version: "1.0.0",
	})

	// ==================== PROJECT MANAGEMENT ====================

	server.registerTool(
		"list-projects",
		{
			title: "List Projects",
			description: "List all projects in your Dokploy instance",
			inputSchema: {},
		},
		async () => {
			const projects = await dokployRequest(config, "/project.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(projects, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-project",
		{
			title: "Create Project",
			description: "Create a new project in Dokploy",
			inputSchema: {
				name: z.string().describe("Project name"),
				description: z.string().optional().describe("Project description"),
			},
		},
		async ({ name, description }) => {
			const result = await dokployRequest(config, "/project.create", "POST", {
				name,
				description: description || "",
			})
			return {
				content: [{
					type: "text",
					text: `✅ Project created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	server.registerTool(
		"delete-project",
		{
			title: "Delete Project",
			description: "Delete a project from Dokploy",
			inputSchema: {
				projectId: z.string().describe("The ID of the project to delete"),
			},
		},
		async ({ projectId }) => {
			const result = await dokployRequest(config, `/project.remove`, "POST", {
				projectId,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Project deleted successfully!`,
				}],
			}
		}
	)

	// ==================== APPLICATION MANAGEMENT ====================

	server.registerTool(
		"list-applications",
		{
			title: "List Applications",
			description: "List all applications in a project",
			inputSchema: {
				projectId: z.string().describe("The project ID to list applications from"),
			},
		},
		async ({ projectId }) => {
			const apps = await dokployRequest(config, `/application.all?projectId=${projectId}`, "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(apps, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-application",
		{
			title: "Create Application",
			description: "Create a new application in Dokploy",
			inputSchema: {
				projectId: z.string().describe("The project ID to create the application in"),
				name: z.string().describe("Application name"),
				appType: z.enum(["docker", "git", "github"]).default("github").describe("Application type"),
				repository: z.string().optional().describe("Git repository URL (for git/github types)"),
				branch: z.string().default("main").describe("Git branch to deploy"),
				buildPath: z.string().default("/").describe("Build path in repository"),
				dockerfile: z.string().optional().describe("Path to Dockerfile (for docker type)"),
				env: z.record(z.string()).optional().describe("Environment variables as key-value pairs"),
			},
		},
		async ({ projectId, name, appType, repository, branch, buildPath, dockerfile, env }) => {
			const result = await dokployRequest(config, "/application.create", "POST", {
				projectId,
				name,
				appType,
				repository,
				branch,
				buildPath,
				dockerfile,
				env: env || {},
			})
			return {
				content: [{
					type: "text",
					text: `✅ Application created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	server.registerTool(
		"deploy-application",
		{
			title: "Deploy Application",
			description: "Deploy an application in Dokploy",
			inputSchema: {
				applicationId: z.string().describe("The ID of the application to deploy"),
			},
		},
		async ({ applicationId }) => {
			const result = await dokployRequest(config, "/application.deploy", "POST", {
				applicationId,
			})
			return {
				content: [{
					type: "text",
					text: `🚀 Deployment started!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	server.registerTool(
		"stop-application",
		{
			title: "Stop Application",
			description: "Stop a running application",
			inputSchema: {
				applicationId: z.string().describe("The ID of the application to stop"),
			},
		},
		async ({ applicationId }) => {
			const result = await dokployRequest(config, "/application.stop", "POST", {
				applicationId,
			})
			return {
				content: [{
					type: "text",
					text: `⏸️ Application stopped successfully!`,
				}],
			}
		}
	)

	server.registerTool(
		"start-application",
		{
			title: "Start Application",
			description: "Start a stopped application",
			inputSchema: {
				applicationId: z.string().describe("The ID of the application to start"),
			},
		},
		async ({ applicationId }) => {
			const result = await dokployRequest(config, "/application.start", "POST", {
				applicationId,
			})
			return {
				content: [{
					type: "text",
					text: `▶️ Application started successfully!`,
				}],
			}
		}
	)

	server.registerTool(
		"restart-application",
		{
			title: "Restart Application",
			description: "Restart an application",
			inputSchema: {
				applicationId: z.string().describe("The ID of the application to restart"),
			},
		},
		async ({ applicationId }) => {
			const result = await dokployRequest(config, "/application.restart", "POST", {
				applicationId,
			})
			return {
				content: [{
					type: "text",
					text: `🔄 Application restarted successfully!`,
				}],
			}
		}
	)

	server.registerTool(
		"delete-application",
		{
			title: "Delete Application",
			description: "Delete an application from Dokploy",
			inputSchema: {
				applicationId: z.string().describe("The ID of the application to delete"),
			},
		},
		async ({ applicationId }) => {
			const result = await dokployRequest(config, "/application.remove", "POST", {
				applicationId,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Application deleted successfully!`,
				}],
			}
		}
	)

	// ==================== DATABASE MANAGEMENT ====================

	server.registerTool(
		"create-database",
		{
			title: "Create Database",
			description: "Create a new database (PostgreSQL, MySQL, MongoDB, Redis, or MariaDB)",
			inputSchema: {
				projectId: z.string().describe("The project ID to create the database in"),
				name: z.string().describe("Database name"),
				type: z.enum(["postgres", "mysql", "mongodb", "redis", "mariadb"]).describe("Database type"),
				databaseName: z.string().optional().describe("Database name (for SQL databases)"),
				username: z.string().optional().describe("Database username"),
				password: z.string().optional().describe("Database password"),
			},
		},
		async ({ projectId, name, type, databaseName, username, password }) => {
			const result = await dokployRequest(config, "/database.create", "POST", {
				projectId,
				name,
				type,
				databaseName,
				username,
				password,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Database created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	server.registerTool(
		"list-databases",
		{
			title: "List Databases",
			description: "List all databases in a project",
			inputSchema: {
				projectId: z.string().describe("The project ID to list databases from"),
			},
		},
		async ({ projectId }) => {
			const databases = await dokployRequest(config, `/database.all?projectId=${projectId}`, "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(databases, null, 2),
				}],
			}
		}
	)

	// ==================== DOCKER COMPOSE MANAGEMENT ====================

	server.registerTool(
		"list-composes",
		{
			title: "List Docker Compose Applications",
			description: "List all Docker Compose applications in a project",
			inputSchema: {
				projectId: z.string().describe("The project ID to list compose applications from"),
			},
		},
		async ({ projectId }) => {
			const composes = await dokployRequest(config, `/compose.all?projectId=${projectId}`, "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(composes, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-compose",
		{
			title: "Create Docker Compose Application",
			description: "Create a new Docker Compose application",
			inputSchema: {
				projectId: z.string().describe("The project ID to create the compose application in"),
				name: z.string().describe("Compose application name"),
				appName: z.string().optional().describe("Application name override"),
				description: z.string().optional().describe("Compose application description"),
				dockerComposeFile: z.string().optional().describe("Docker Compose file content"),
				dockerComposeFilePath: z.string().optional().describe("Path to Docker Compose file in repository"),
				repository: z.string().optional().describe("Git repository URL"),
				branch: z.string().default("main").describe("Git branch to deploy"),
				buildPath: z.string().default("/").describe("Build path in repository"),
				env: z.record(z.string()).optional().describe("Environment variables as key-value pairs"),
			},
		},
		async ({ projectId, name, appName, description, dockerComposeFile, dockerComposeFilePath, repository, branch, buildPath, env }) => {
			const result = await dokployRequest(config, "/compose.create", "POST", {
				projectId,
				name,
				appName,
				description: description || "",
				dockerComposeFile,
				dockerComposeFilePath,
				repository,
				branch,
				buildPath,
				env: env || {},
			})
			return {
				content: [{
					type: "text",
					text: `✅ Docker Compose application created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	server.registerTool(
		"deploy-compose",
		{
			title: "Deploy Docker Compose Application",
			description: "Deploy a Docker Compose application",
			inputSchema: {
				composeId: z.string().describe("The ID of the compose application to deploy"),
			},
		},
		async ({ composeId }) => {
			const result = await dokployRequest(config, "/compose.deploy", "POST", {
				composeId,
			})
			return {
				content: [{
					type: "text",
					text: `🚀 Docker Compose deployment started!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	server.registerTool(
		"stop-compose",
		{
			title: "Stop Docker Compose Application",
			description: "Stop a running Docker Compose application",
			inputSchema: {
				composeId: z.string().describe("The ID of the compose application to stop"),
			},
		},
		async ({ composeId }) => {
			const result = await dokployRequest(config, "/compose.stop", "POST", {
				composeId,
			})
			return {
				content: [{
					type: "text",
					text: `⏸️ Docker Compose application stopped successfully!`,
				}],
			}
		}
	)

	server.registerTool(
		"start-compose",
		{
			title: "Start Docker Compose Application",
			description: "Start a stopped Docker Compose application",
			inputSchema: {
				composeId: z.string().describe("The ID of the compose application to start"),
			},
		},
		async ({ composeId }) => {
			const result = await dokployRequest(config, "/compose.start", "POST", {
				composeId,
			})
			return {
				content: [{
					type: "text",
					text: `▶️ Docker Compose application started successfully!`,
				}],
			}
		}
	)

	server.registerTool(
		"restart-compose",
		{
			title: "Restart Docker Compose Application",
			description: "Restart a Docker Compose application",
			inputSchema: {
				composeId: z.string().describe("The ID of the compose application to restart"),
			},
		},
		async ({ composeId }) => {
			const result = await dokployRequest(config, "/compose.restart", "POST", {
				composeId,
			})
			return {
				content: [{
					type: "text",
					text: `🔄 Docker Compose application restarted successfully!`,
				}],
			}
		}
	)

	server.registerTool(
		"delete-compose",
		{
			title: "Delete Docker Compose Application",
			description: "Delete a Docker Compose application",
			inputSchema: {
				composeId: z.string().describe("The ID of the compose application to delete"),
			},
		},
		async ({ composeId }) => {
			const result = await dokployRequest(config, "/compose.remove", "POST", {
				composeId,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Docker Compose application deleted successfully!`,
				}],
			}
		}
	)

	server.registerTool(
		"get-compose-logs",
		{
			title: "Get Docker Compose Application Logs",
			description: "Get recent logs for a Docker Compose application",
			inputSchema: {
				composeId: z.string().describe("The compose application ID"),
				lines: z.number().default(100).describe("Number of log lines to retrieve"),
			},
		},
		async ({ composeId, lines }) => {
			const logs = await dokployRequest(config, `/compose.logs?composeId=${composeId}&lines=${lines}`, "GET")
			return {
				content: [{
					type: "text",
					text: typeof logs === 'string' ? logs : JSON.stringify(logs, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"get-compose-status",
		{
			title: "Get Docker Compose Application Status",
			description: "Get the current status and health of a Docker Compose application",
			inputSchema: {
				composeId: z.string().describe("The compose application ID"),
			},
		},
		async ({ composeId }) => {
			const status = await dokployRequest(config, `/compose.status?composeId=${composeId}`, "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(status, null, 2),
				}],
			}
		}
	)

	// ==================== GIT PROVIDER MANAGEMENT ====================

	server.registerTool(
		"list-git-providers",
		{
			title: "List Git Providers",
			description: "List all configured Git providers",
			inputSchema: {},
		},
		async () => {
			const providers = await dokployRequest(config, "/git-provider.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(providers, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-github-provider",
		{
			title: "Create GitHub Provider",
			description: "Create a new GitHub provider configuration",
			inputSchema: {
				name: z.string().describe("Provider name"),
				githubAppName: z.string().optional().describe("GitHub App name"),
				githubAppId: z.string().optional().describe("GitHub App ID"),
				githubClientId: z.string().optional().describe("GitHub OAuth App Client ID"),
				githubClientSecret: z.string().optional().describe("GitHub OAuth App Client Secret"),
				githubInstallationId: z.string().optional().describe("GitHub App Installation ID"),
				githubPrivateKey: z.string().optional().describe("GitHub App Private Key"),
			},
		},
		async ({ name, githubAppName, githubAppId, githubClientId, githubClientSecret, githubInstallationId, githubPrivateKey }) => {
			const result = await dokployRequest(config, "/github.create", "POST", {
				name,
				githubAppName,
				githubAppId,
				githubClientId,
				githubClientSecret,
				githubInstallationId,
				githubPrivateKey,
			})
			return {
				content: [{
					type: "text",
					text: `✅ GitHub provider created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	server.registerTool(
		"create-gitlab-provider",
		{
			title: "Create GitLab Provider",
			description: "Create a new GitLab provider configuration",
			inputSchema: {
				name: z.string().describe("Provider name"),
				gitlabUrl: z.string().optional().describe("GitLab instance URL"),
				applicationId: z.string().optional().describe("GitLab Application ID"),
				secret: z.string().optional().describe("GitLab Application Secret"),
				redirectUrl: z.string().optional().describe("OAuth redirect URL"),
				groupName: z.string().optional().describe("GitLab group name"),
			},
		},
		async ({ name, gitlabUrl, applicationId, secret, redirectUrl, groupName }) => {
			const result = await dokployRequest(config, "/gitlab.create", "POST", {
				name,
				gitlabUrl,
				applicationId,
				secret,
				redirectUrl,
				groupName,
			})
			return {
				content: [{
					type: "text",
					text: `✅ GitLab provider created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	server.registerTool(
		"create-gitea-provider",
		{
			title: "Create Gitea Provider",
			description: "Create a new Gitea provider configuration",
			inputSchema: {
				name: z.string().describe("Provider name"),
				giteaUrl: z.string().optional().describe("Gitea instance URL"),
				applicationId: z.string().optional().describe("Gitea Application ID"),
				secret: z.string().optional().describe("Gitea Application Secret"),
				redirectUrl: z.string().optional().describe("OAuth redirect URL"),
			},
		},
		async ({ name, giteaUrl, applicationId, secret, redirectUrl }) => {
			const result = await dokployRequest(config, "/gitea.create", "POST", {
				name,
				giteaUrl,
				applicationId,
				secret,
				redirectUrl,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Gitea provider created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	server.registerTool(
		"create-bitbucket-provider",
		{
			title: "Create Bitbucket Provider",
			description: "Create a new Bitbucket provider configuration",
			inputSchema: {
				name: z.string().describe("Provider name"),
				bitbucketUsername: z.string().optional().describe("Bitbucket username"),
				bitbucketAppPassword: z.string().optional().describe("Bitbucket App Password"),
				bitbucketWorkspaceName: z.string().optional().describe("Bitbucket workspace name"),
			},
		},
		async ({ name, bitbucketUsername, bitbucketAppPassword, bitbucketWorkspaceName }) => {
			const result = await dokployRequest(config, "/bitbucket.create", "POST", {
				name,
				bitbucketUsername,
				bitbucketAppPassword,
				bitbucketWorkspaceName,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Bitbucket provider created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== SERVER MANAGEMENT ====================

	server.registerTool(
		"list-servers",
		{
			title: "List Servers",
			description: "List all configured servers",
			inputSchema: {},
		},
		async () => {
			const servers = await dokployRequest(config, "/server.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(servers, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-server",
		{
			title: "Create Server",
			description: "Create a new server configuration",
			inputSchema: {
				name: z.string().describe("Server name"),
				ipAddress: z.string().describe("Server IP address"),
				port: z.number().default(22).describe("SSH port"),
				username: z.string().default("root").describe("SSH username"),
				description: z.string().optional().describe("Server description"),
			},
		},
		async ({ name, ipAddress, port, username, description }) => {
			const result = await dokployRequest(config, "/server.create", "POST", {
				name,
				ipAddress,
				port,
				username,
				description: description || "",
			})
			return {
				content: [{
					type: "text",
					text: `✅ Server created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	server.registerTool(
		"get-server-status",
		{
			title: "Get Server Status",
			description: "Get the current status and health of a server",
			inputSchema: {
				serverId: z.string().describe("The server ID"),
			},
		},
		async ({ serverId }) => {
			const status = await dokployRequest(config, `/server.status?serverId=${serverId}`, "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(status, null, 2),
				}],
			}
		}
	)

	// ==================== USER MANAGEMENT ====================

	server.registerTool(
		"list-users",
		{
			title: "List Users",
			description: "List all users in the Dokploy instance",
			inputSchema: {},
		},
		async () => {
			const users = await dokployRequest(config, "/user.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(users, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-user",
		{
			title: "Create User",
			description: "Create a new user account",
			inputSchema: {
				email: z.string().email().describe("User email address"),
				password: z.string().describe("User password"),
				name: z.string().optional().describe("User display name"),
				isAdmin: z.boolean().default(false).describe("Whether the user should have admin privileges"),
			},
		},
		async ({ email, password, name, isAdmin }) => {
			const result = await dokployRequest(config, "/user.create", "POST", {
				email,
				password,
				name,
				isAdmin,
			})
			return {
				content: [{
					type: "text",
					text: `✅ User created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== CERTIFICATE MANAGEMENT ====================

	server.registerTool(
		"list-certificates",
		{
			title: "List SSL Certificates",
			description: "List all SSL certificates",
			inputSchema: {},
		},
		async () => {
			const certificates = await dokployRequest(config, "/certificate.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(certificates, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-certificate",
		{
			title: "Create SSL Certificate",
			description: "Create a new SSL certificate",
			inputSchema: {
				name: z.string().describe("Certificate name"),
				certificate: z.string().describe("SSL certificate content"),
				privateKey: z.string().describe("Private key content"),
			},
		},
		async ({ name, certificate, privateKey }) => {
			const result = await dokployRequest(config, "/certificate.create", "POST", {
				name,
				certificate,
				privateKey,
			})
			return {
				content: [{
					type: "text",
					text: `✅ SSL certificate created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== NOTIFICATION MANAGEMENT ====================

	server.registerTool(
		"list-notifications",
		{
			title: "List Notifications",
			description: "List all notification configurations",
			inputSchema: {},
		},
		async () => {
			const notifications = await dokployRequest(config, "/notification.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(notifications, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-notification",
		{
			title: "Create Notification",
			description: "Create a new notification configuration",
			inputSchema: {
				name: z.string().describe("Notification name"),
				type: z.enum(["discord", "slack", "telegram", "email"]).describe("Notification type"),
				webhookUrl: z.string().optional().describe("Webhook URL for Discord/Slack"),
				botToken: z.string().optional().describe("Bot token for Telegram"),
				chatId: z.string().optional().describe("Chat ID for Telegram"),
				smtpUrl: z.string().optional().describe("SMTP URL for email notifications"),
				to: z.string().optional().describe("Email recipient"),
			},
		},
		async ({ name, type, webhookUrl, botToken, chatId, smtpUrl, to }) => {
			const result = await dokployRequest(config, "/notification.create", "POST", {
				name,
				type,
				webhookUrl,
				botToken,
				chatId,
				smtpUrl,
				to,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Notification created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== SSH KEY MANAGEMENT ====================

	server.registerTool(
		"list-ssh-keys",
		{
			title: "List SSH Keys",
			description: "List all SSH keys",
			inputSchema: {},
		},
		async () => {
			const sshKeys = await dokployRequest(config, "/ssh-key.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(sshKeys, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-ssh-key",
		{
			title: "Create SSH Key",
			description: "Create a new SSH key",
			inputSchema: {
				name: z.string().describe("SSH key name"),
				description: z.string().optional().describe("SSH key description"),
				privateKey: z.string().describe("Private key content"),
				publicKey: z.string().optional().describe("Public key content"),
			},
		},
		async ({ name, description, privateKey, publicKey }) => {
			const result = await dokployRequest(config, "/ssh-key.create", "POST", {
				name,
				description: description || "",
				privateKey,
				publicKey,
			})
			return {
				content: [{
					type: "text",
					text: `✅ SSH key created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== SETTINGS MANAGEMENT ====================

	server.registerTool(
		"get-settings",
		{
			title: "Get System Settings",
			description: "Get current system settings",
			inputSchema: {},
		},
		async () => {
			const settings = await dokployRequest(config, "/settings.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(settings, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"update-settings",
		{
			title: "Update System Settings",
			description: "Update system settings",
			inputSchema: {
				enableDockerCleanup: z.boolean().optional().describe("Enable automatic Docker cleanup"),
				enableDockerPrune: z.boolean().optional().describe("Enable Docker prune on cleanup"),
				dockerCleanupInterval: z.string().optional().describe("Docker cleanup interval (cron format)"),
				enableStats: z.boolean().optional().describe("Enable system statistics collection"),
				serverTimezone: z.string().optional().describe("Server timezone"),
			},
		},
		async ({ enableDockerCleanup, enableDockerPrune, dockerCleanupInterval, enableStats, serverTimezone }) => {
			const result = await dokployRequest(config, "/settings.update", "POST", {
				enableDockerCleanup,
				enableDockerPrune,
				dockerCleanupInterval,
				enableStats,
				serverTimezone,
			})
			return {
				content: [{
					type: "text",
					text: `✅ System settings updated successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== DOMAIN & SSL MANAGEMENT ====================

	server.registerTool(
		"add-domain",
		{
			title: "Add Domain",
			description: "Add a custom domain to an application",
			inputSchema: {
				applicationId: z.string().describe("The application ID"),
				domain: z.string().describe("Domain name (e.g., example.com)"),
				enableSSL: z.boolean().default(true).describe("Enable automatic SSL with Let's Encrypt"),
			},
		},
		async ({ applicationId, domain, enableSSL }) => {
			const result = await dokployRequest(config, "/domain.create", "POST", {
				applicationId,
				domain,
				enableSSL,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Domain added successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	server.registerTool(
		"list-domains",
		{
			title: "List Domains",
			description: "List all domains for an application",
			inputSchema: {
				applicationId: z.string().describe("The application ID"),
			},
		},
		async ({ applicationId }) => {
			const domains = await dokployRequest(config, `/domain.all?applicationId=${applicationId}`, "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(domains, null, 2),
				}],
			}
		}
	)

	// ==================== BACKUP & RESTORE ====================

	server.registerTool(
		"create-backup",
		{
			title: "Create Backup",
			description: "Create a backup of a database",
			inputSchema: {
				databaseId: z.string().describe("The database ID to backup"),
			},
		},
		async ({ databaseId }) => {
			const result = await dokployRequest(config, "/backup.create", "POST", {
				databaseId,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Backup created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	server.registerTool(
		"list-backups",
		{
			title: "List Backups",
			description: "List all backups for a database",
			inputSchema: {
				databaseId: z.string().describe("The database ID"),
			},
		},
		async ({ databaseId }) => {
			const backups = await dokployRequest(config, `/backup.all?databaseId=${databaseId}`, "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(backups, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"restore-backup",
		{
			title: "Restore Backup",
			description: "Restore a database from a backup",
			inputSchema: {
				backupId: z.string().describe("The backup ID to restore"),
			},
		},
		async ({ backupId }) => {
			const result = await dokployRequest(config, "/backup.restore", "POST", {
				backupId,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Backup restored successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== MONITORING & LOGS ====================

	server.registerTool(
		"get-logs",
		{
			title: "Get Application Logs",
			description: "Get recent logs for an application",
			inputSchema: {
				applicationId: z.string().describe("The application ID"),
				lines: z.number().default(100).describe("Number of log lines to retrieve"),
			},
		},
		async ({ applicationId, lines }) => {
			const logs = await dokployRequest(config, `/application.logs?applicationId=${applicationId}&lines=${lines}`, "GET")
			return {
				content: [{
					type: "text",
					text: typeof logs === 'string' ? logs : JSON.stringify(logs, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"get-application-status",
		{
			title: "Get Application Status",
			description: "Get the current status and health of an application",
			inputSchema: {
				applicationId: z.string().describe("The application ID"),
			},
		},
		async ({ applicationId }) => {
			const status = await dokployRequest(config, `/application.status?applicationId=${applicationId}`, "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(status, null, 2),
				}],
			}
		}
	)

	// ==================== ENVIRONMENT VARIABLES ====================

	server.registerTool(
		"update-env-vars",
		{
			title: "Update Environment Variables",
			description: "Update environment variables for an application",
			inputSchema: {
				applicationId: z.string().describe("The application ID"),
				env: z.record(z.string()).describe("Environment variables as key-value pairs"),
			},
		},
		async ({ applicationId, env }) => {
			const result = await dokployRequest(config, "/application.updateEnv", "POST", {
				applicationId,
				env,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Environment variables updated successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== DEPLOYMENT MANAGEMENT ====================

	server.registerTool(
		"list-deployments",
		{
			title: "List Deployments",
			description: "List all deployments for an application",
			inputSchema: {
				applicationId: z.string().optional().describe("Application ID to filter deployments"),
				composeId: z.string().optional().describe("Compose ID to filter deployments"),
			},
		},
		async ({ applicationId, composeId }) => {
			let endpoint = "/deployment.all"
			const params = new URLSearchParams()
			if (applicationId) params.append("applicationId", applicationId)
			if (composeId) params.append("composeId", composeId)
			if (params.toString()) endpoint += `?${params.toString()}`

			const deployments = await dokployRequest(config, endpoint, "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(deployments, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"cancel-deployment",
		{
			title: "Cancel Deployment",
			description: "Cancel a running deployment",
			inputSchema: {
				applicationId: z.string().optional().describe("Application ID"),
				composeId: z.string().optional().describe("Compose ID"),
			},
		},
		async ({ applicationId, composeId }) => {
			const result = await dokployRequest(config, "/deployment.cancel", "POST", {
				applicationId,
				composeId,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Deployment cancelled successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== REGISTRY MANAGEMENT ====================

	server.registerTool(
		"list-registries",
		{
			title: "List Docker Registries",
			description: "List all configured Docker registries",
			inputSchema: {},
		},
		async () => {
			const registries = await dokployRequest(config, "/registry.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(registries, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-registry",
		{
			title: "Create Docker Registry",
			description: "Create a new Docker registry configuration",
			inputSchema: {
				name: z.string().describe("Registry name"),
				registryUrl: z.string().describe("Registry URL"),
				username: z.string().optional().describe("Registry username"),
				password: z.string().optional().describe("Registry password"),
			},
		},
		async ({ name, registryUrl, username, password }) => {
			const result = await dokployRequest(config, "/registry.create", "POST", {
				name,
				registryUrl,
				username,
				password,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Docker registry created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== REDIRECT MANAGEMENT ====================

	server.registerTool(
		"list-redirects",
		{
			title: "List Redirects",
			description: "List all redirect rules",
			inputSchema: {},
		},
		async () => {
			const redirects = await dokployRequest(config, "/redirect.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(redirects, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-redirect",
		{
			title: "Create Redirect",
			description: "Create a new redirect rule",
			inputSchema: {
				domain: z.string().describe("Source domain"),
				redirect: z.string().describe("Target URL"),
				redirectType: z.enum(["temporary", "permanent"]).default("permanent").describe("Redirect type"),
			},
		},
		async ({ domain, redirect, redirectType }) => {
			const result = await dokployRequest(config, "/redirect.create", "POST", {
				domain,
				redirect,
				redirectType,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Redirect rule created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== SCHEDULE MANAGEMENT ====================

	server.registerTool(
		"list-schedules",
		{
			title: "List Schedules",
			description: "List all scheduled tasks",
			inputSchema: {},
		},
		async () => {
			const schedules = await dokployRequest(config, "/schedule.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(schedules, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-schedule",
		{
			title: "Create Schedule",
			description: "Create a new scheduled task",
			inputSchema: {
				name: z.string().describe("Schedule name"),
				cronExpression: z.string().describe("Cron expression (e.g., '0 0 * * *' for daily)"),
				applicationId: z.string().optional().describe("Application ID to redeploy"),
				composeId: z.string().optional().describe("Compose ID to redeploy"),
				databaseId: z.string().optional().describe("Database ID to backup"),
				enabled: z.boolean().default(true).describe("Whether the schedule is enabled"),
			},
		},
		async ({ name, cronExpression, applicationId, composeId, databaseId, enabled }) => {
			const result = await dokployRequest(config, "/schedule.create", "POST", {
				name,
				cronExpression,
				applicationId,
				composeId,
				databaseId,
				enabled,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Schedule created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== ROLLBACK MANAGEMENT ====================

	server.registerTool(
		"list-rollbacks",
		{
			title: "List Rollbacks",
			description: "List available rollback points for an application",
			inputSchema: {
				applicationId: z.string().describe("Application ID"),
			},
		},
		async ({ applicationId }) => {
			const rollbacks = await dokployRequest(config, `/rollbacks.all?applicationId=${applicationId}`, "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(rollbacks, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"rollback-application",
		{
			title: "Rollback Application",
			description: "Rollback an application to a previous deployment",
			inputSchema: {
				applicationId: z.string().describe("Application ID"),
				rollbackId: z.string().describe("Rollback point ID"),
			},
		},
		async ({ applicationId, rollbackId }) => {
			const result = await dokployRequest(config, "/rollbacks.rollback", "POST", {
				applicationId,
				rollbackId,
			})
			return {
				content: [{
					type: "text",
					text: `⏪ Application rolled back successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== VOLUME BACKUPS MANAGEMENT ====================

	server.registerTool(
		"list-volume-backups",
		{
			title: "List Volume Backups",
			description: "List all volume backups",
			inputSchema: {},
		},
		async () => {
			const backups = await dokployRequest(config, "/volume-backups.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(backups, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-volume-backup",
		{
			title: "Create Volume Backup",
			description: "Create a backup of a Docker volume",
			inputSchema: {
				name: z.string().describe("Backup name"),
				volumeName: z.string().describe("Docker volume name"),
				destinationPath: z.string().optional().describe("Destination path for the backup"),
			},
		},
		async ({ name, volumeName, destinationPath }) => {
			const result = await dokployRequest(config, "/volume-backups.create", "POST", {
				name,
				volumeName,
				destinationPath,
			})
			return {
				content: [{
					type: "text",
					text: `💾 Volume backup created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== MOUNT MANAGEMENT ====================

	server.registerTool(
		"list-mounts",
		{
			title: "List Mounts",
			description: "List all volume mounts",
			inputSchema: {},
		},
		async () => {
			const mounts = await dokployRequest(config, "/mount.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(mounts, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-mount",
		{
			title: "Create Mount",
			description: "Create a new volume mount",
			inputSchema: {
				name: z.string().describe("Mount name"),
				volumeName: z.string().describe("Docker volume name"),
				containerPath: z.string().describe("Path inside the container"),
				applicationId: z.string().optional().describe("Application ID to attach mount to"),
				composeId: z.string().optional().describe("Compose ID to attach mount to"),
			},
		},
		async ({ name, volumeName, containerPath, applicationId, composeId }) => {
			const result = await dokployRequest(config, "/mount.create", "POST", {
				name,
				volumeName,
				containerPath,
				applicationId,
				composeId,
			})
			return {
				content: [{
					type: "text",
					text: `📁 Mount created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== PORT MANAGEMENT ====================

	server.registerTool(
		"list-ports",
		{
			title: "List Ports",
			description: "List all configured ports",
			inputSchema: {},
		},
		async () => {
			const ports = await dokployRequest(config, "/port.all", "GET")
			return {
				content: [{
					type: "text",
					text: JSON.stringify(ports, null, 2),
				}],
			}
		}
	)

	server.registerTool(
		"create-port",
		{
			title: "Create Port",
			description: "Create a new port configuration",
			inputSchema: {
				publishedPort: z.number().describe("Published port on host"),
				targetPort: z.number().describe("Target port in container"),
				protocol: z.enum(["tcp", "udp"]).default("tcp").describe("Port protocol"),
				applicationId: z.string().optional().describe("Application ID"),
				composeId: z.string().optional().describe("Compose ID"),
			},
		},
		async ({ publishedPort, targetPort, protocol, applicationId, composeId }) => {
			const result = await dokployRequest(config, "/port.create", "POST", {
				publishedPort,
				targetPort,
				protocol,
				applicationId,
				composeId,
			})
			return {
				content: [{
					type: "text",
					text: `🔌 Port configuration created successfully!\n\n${JSON.stringify(result, null, 2)}`,
				}],
			}
		}
	)

	// ==================== RESOURCES (Documentation) ====================

	server.registerResource(
		"dokploy-docs",
		"dokploy://docs",
		{
			title: "Dokploy Documentation",
			description: "Official Dokploy documentation and guides",
		},
		async (uri) => ({
			contents: [{
				uri: uri.href,
				text: `# Dokploy Documentation

Dokploy is an open-source alternative to Netlify, Vercel, and Heroku. It allows you to deploy your applications easily using Docker and provides a simple API for management.

## Key Features

- **Easy Deployment**: Deploy applications from Git repositories with automatic builds
- **Multiple Languages**: Support for Node.js, Python, Go, PHP, and more
- **Database Support**: Built-in support for PostgreSQL, MySQL, MongoDB, Redis, and MariaDB
- **Custom Domains**: Add custom domains with automatic SSL via Let's Encrypt
- **Backups**: Automatic and manual database backups
- **Monitoring**: Real-time logs and application status monitoring
- **Environment Variables**: Secure environment variable management
- **Docker Support**: Native Docker and Docker Compose support

## Getting Started

1. Create a new project using the \`create-project\` tool
2. Create an application within the project using \`create-application\`
3. Deploy your application using \`deploy-application\`
4. (Optional) Add a custom domain using \`add-domain\`

## API Reference

Visit your Dokploy instance's Swagger documentation at: ${config.dokployUrl}/swagger

## Support

- Documentation: https://docs.dokploy.com
- GitHub: https://github.com/dokploy/dokploy
- Discord: Join the Dokploy community

## Best Practices

- Always use environment variables for sensitive data
- Enable SSL for production domains
- Set up regular database backups
- Monitor application logs regularly
- Use health checks for critical applications
`,
				mimeType: "text/markdown",
			}],
		})
	)

	server.registerResource(
		"dokploy-quickstart",
		"dokploy://quickstart",
		{
			title: "Dokploy Quick Start Guide",
			description: "Quick start guide for deploying your first application",
		},
		async (uri) => ({
			contents: [{
				uri: uri.href,
				text: `# Dokploy Quick Start

## Deploy Your First Application

Follow these steps to deploy your first application on Dokploy:

### Step 1: Create a Project
\`\`\`
Use the 'create-project' tool:
- Name: my-first-project
- Description: My first Dokploy project
\`\`\`

### Step 2: Create an Application
\`\`\`
Use the 'create-application' tool:
- Project ID: (from step 1)
- Name: my-app
- App Type: github
- Repository: https://github.com/yourusername/your-repo
- Branch: main
\`\`\`

### Step 3: Deploy
\`\`\`
Use the 'deploy-application' tool with the application ID from step 2
\`\`\`

### Step 4: Monitor
\`\`\`
Check deployment status with 'get-application-status'
View logs with 'get-logs'
\`\`\`

### Step 5: Add a Domain (Optional)
\`\`\`
Use the 'add-domain' tool to add your custom domain
\`\`\`

## Example: Deploy a Node.js App

1. Create project: "my-node-app"
2. Create application from your GitHub repository
3. Set environment variables (if needed)
4. Deploy!

That's it! Your application will be live in minutes.
`,
				mimeType: "text/markdown",
			}],
		})
	)

	server.registerResource(
		"dokploy-api-reference",
		"dokploy://api-reference",
		{
			title: "Dokploy API Reference",
			description: "Complete API reference for Dokploy REST API",
		},
		async (uri) => ({
			contents: [{
					uri: uri.href,
				text: `# Dokploy API Reference

Base URL: ${config.dokployUrl}/api

## Authentication
All API requests require authentication using a Bearer token:
\`\`\`
Authorization: Bearer YOUR_API_TOKEN
\`\`\`

## Endpoints

### Projects
- \`GET /api/project.all\` - List all projects
- \`POST /api/project.create\` - Create a new project
- \`POST /api/project.remove\` - Delete a project

### Applications
- \`GET /api/application.all\` - List all applications
- \`POST /api/application.create\` - Create a new application
- \`POST /api/application.deploy\` - Deploy an application
- \`POST /api/application.start\` - Start an application
- \`POST /api/application.stop\` - Stop an application
- \`POST /api/application.restart\` - Restart an application
- \`POST /api/application.remove\` - Delete an application
- \`GET /api/application.logs\` - Get application logs
- \`GET /api/application.status\` - Get application status
- \`POST /api/application.updateEnv\` - Update environment variables

### Databases
- \`GET /api/database.all\` - List all databases
- \`POST /api/database.create\` - Create a new database

### Domains
- \`GET /api/domain.all\` - List all domains
- \`POST /api/domain.create\` - Add a new domain

### Backups
- \`GET /api/backup.all\` - List all backups
- \`POST /api/backup.create\` - Create a backup
- \`POST /api/backup.restore\` - Restore from backup

For full API documentation, visit: ${config.dokployUrl}/swagger
`,
				mimeType: "text/markdown",
			}],
		})
	)

	// ==================== PROMPTS ====================

	server.registerPrompt(
		"deploy-app",
		{
			title: "Deploy Application Workflow",
			description: "Interactive prompt to guide through application deployment",
			argsSchema: {
				projectName: z.string().describe("Name for the new project"),
				appName: z.string().describe("Name for the application"),
				repository: z.string().describe("Git repository URL"),
			},
		},
		async ({ projectName, appName, repository }) => ({
			messages: [{
				role: "user",
				content: {
					type: "text",
					text: `I want to deploy a new application on Dokploy. Here are the details:
- Project Name: ${projectName}
- Application Name: ${appName}
- Repository: ${repository}

Please help me:
1. Create a new project
2. Create an application in that project
3. Deploy the application
4. Check the deployment status

Guide me through each step.`,
				},
			}],
		})
	)

	server.registerPrompt(
		"setup-database",
		{
			title: "Database Setup Workflow",
			description: "Interactive prompt to guide through database creation and configuration",
			argsSchema: {
				projectId: z.string().describe("Project ID to create the database in"),
				dbType: z.enum(["postgres", "mysql", "mongodb", "redis", "mariadb"]).describe("Database type"),
				dbName: z.string().describe("Database name"),
			},
		},
		async ({ projectId, dbType, dbName }) => ({
			messages: [{
						role: "user",
						content: {
							type: "text",
					text: `I want to set up a ${dbType} database named "${dbName}" in project ${projectId}.

Please help me:
1. Create the database
2. Show me the connection details
3. Set up automatic backups

Guide me through the process.`,
				},
			}],
		})
	)

	server.registerPrompt(
		"troubleshoot",
		{
			title: "Troubleshoot Application",
			description: "Interactive prompt to help troubleshoot application issues",
			argsSchema: {
				applicationId: z.string().describe("Application ID to troubleshoot"),
			},
		},
		async ({ applicationId }) => ({
			messages: [{
				role: "user",
				content: {
					type: "text",
					text: `My application (ID: ${applicationId}) is having issues. Please help me troubleshoot by:
1. Checking the application status
2. Reviewing recent logs
3. Suggesting potential fixes

Start the diagnostic process.`,
				},
			}],
		})
	)

	return server.server
}
