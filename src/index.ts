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
			// Applications are retrieved through project.all endpoint
			const projects = await dokployRequest(config, "/project.all", "GET")
			const project = projects.find((p: any) => p.projectId === projectId)

			if (!project) {
				throw new Error(`Project with ID ${projectId} not found`)
			}

			// Extract applications from all environments in the project
			const applications: any[] = []
			project.environments.forEach((env: any) => {
				if (env.applications && env.applications.length > 0) {
					applications.push(...env.applications.map((app: any) => ({
						...app,
						environmentId: env.environmentId,
						environmentName: env.name,
					})))
				}
			})

			return {
				content: [{
					type: "text",
					text: JSON.stringify(applications, null, 2),
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
				environmentId: z.string().optional().describe("The environment ID (if not provided, uses the default environment)"),
				name: z.string().describe("Application name"),
				appType: z.enum(["docker", "git", "github"]).default("github").describe("Application type"),
				repository: z.string().optional().describe("Git repository URL (for git/github types)"),
				branch: z.string().default("main").describe("Git branch to deploy"),
				buildPath: z.string().default("/").describe("Build path in repository"),
				dockerfile: z.string().optional().describe("Path to Dockerfile (for docker type)"),
				env: z.record(z.string()).optional().describe("Environment variables as key-value pairs"),
			},
		},
		async ({ projectId, environmentId, name, appType, repository, branch, buildPath, dockerfile, env }) => {
			// If environmentId is not provided, get the default environment for the project
			let targetEnvironmentId = environmentId
			if (!targetEnvironmentId) {
				const projects = await dokployRequest(config, "/project.all", "GET")
				const project = projects.find((p: any) => p.projectId === projectId)
				if (!project) {
					throw new Error(`Project with ID ${projectId} not found`)
				}
				const defaultEnv = project.environments.find((env: any) => env.isDefault)
				if (!defaultEnv) {
					throw new Error(`No default environment found for project ${projectId}`)
				}
				targetEnvironmentId = defaultEnv.environmentId
			}

			const result = await dokployRequest(config, "/application.create", "POST", {
				projectId,
				environmentId: targetEnvironmentId,
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
			const result = await dokployRequest(config, "/application.delete", "POST", {
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
				environmentId: z.string().optional().describe("The environment ID (if not provided, uses the default environment)"),
				name: z.string().describe("Database name"),
				type: z.enum(["postgres", "mysql", "mongodb", "redis", "mariadb"]).describe("Database type"),
				appName: z.string().optional().describe("Application name (auto-generated if not provided)"),
				databaseName: z.string().optional().describe("Database name (auto-generated if not provided)"),
				databaseUser: z.string().optional().describe("Database username (auto-generated if not provided)"),
				databasePassword: z.string().optional().describe("Database password (auto-generated if not provided)"),
			},
		},
		async ({ projectId, environmentId, name, type, appName, databaseName, databaseUser, databasePassword }) => {
			// If environmentId is not provided, get the default environment for the project
			let targetEnvironmentId = environmentId
			if (!targetEnvironmentId) {
				const projects = await dokployRequest(config, "/project.all", "GET")
				const project = projects.find((p: any) => p.projectId === projectId)
				if (!project) {
					throw new Error(`Project with ID ${projectId} not found`)
				}
				const defaultEnv = project.environments.find((env: any) => env.isDefault)
				if (!defaultEnv) {
					throw new Error(`No default environment found for project ${projectId}`)
				}
				targetEnvironmentId = defaultEnv.environmentId
			}

			// Generate default values if not provided
			const generatedAppName = appName || `${name}-${type}-${Math.random().toString(36).substring(7)}`
			const generatedDbName = databaseName || name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
			const generatedUser = databaseUser || `${type}user`
			const generatedPassword = databasePassword || Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)

			const result = await dokployRequest(config, `/${type}.create`, "POST", {
				projectId,
				environmentId: targetEnvironmentId,
				name,
				appName: generatedAppName,
				databaseName: generatedDbName,
				databaseUser: generatedUser,
				databasePassword: generatedPassword,
			})
			return {
				content: [{
					type: "text",
					text: `✅ Database created successfully!\n\nDatabase Details:\n- Type: ${type}\n- App Name: ${generatedAppName}\n- Database: ${generatedDbName}\n- Username: ${generatedUser}\n- Password: ${generatedPassword}\n\n${JSON.stringify(result, null, 2)}`,
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
			// Databases are retrieved through project.all endpoint
			const projects = await dokployRequest(config, "/project.all", "GET")
			const project = projects.find((p: any) => p.projectId === projectId)

			if (!project) {
				throw new Error(`Project with ID ${projectId} not found`)
			}

			// Extract databases from all environments in the project
			const databases: any[] = []
			project.environments.forEach((env: any) => {
				const dbTypes = ['mariadb', 'mongo', 'mysql', 'postgres', 'redis']
				dbTypes.forEach(dbType => {
					if (env[dbType] && env[dbType].length > 0) {
						env[dbType].forEach((db: any) => {
							databases.push({
								...db,
								type: dbType,
								environmentId: env.environmentId,
								environmentName: env.name,
							})
						})
					}
				})
			})

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
			// Compose applications are retrieved through project.all endpoint
			const projects = await dokployRequest(config, "/project.all", "GET")
			const project = projects.find((p: any) => p.projectId === projectId)

			if (!project) {
				throw new Error(`Project with ID ${projectId} not found`)
			}

			// Extract compose applications from all environments in the project
			const composes: any[] = []
			project.environments.forEach((env: any) => {
				if (env.compose && env.compose.length > 0) {
					composes.push(...env.compose.map((compose: any) => ({
						...compose,
						environmentId: env.environmentId,
						environmentName: env.name,
					})))
				}
			})

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
				environmentId: z.string().optional().describe("The environment ID (if not provided, uses the default environment)"),
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
		async ({ projectId, environmentId, name, appName, description, dockerComposeFile, dockerComposeFilePath, repository, branch, buildPath, env }) => {
			// If environmentId is not provided, get the default environment for the project
			let targetEnvironmentId = environmentId
			if (!targetEnvironmentId) {
				const projects = await dokployRequest(config, "/project.all", "GET")
				const project = projects.find((p: any) => p.projectId === projectId)
				if (!project) {
					throw new Error(`Project with ID ${projectId} not found`)
				}
				const defaultEnv = project.environments.find((env: any) => env.isDefault)
				if (!defaultEnv) {
					throw new Error(`No default environment found for project ${projectId}`)
				}
				targetEnvironmentId = defaultEnv.environmentId
			}

			const result = await dokployRequest(config, "/compose.create", "POST", {
				projectId,
				environmentId: targetEnvironmentId,
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
			const result = await dokployRequest(config, "/compose.delete", "POST", {
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
