# Contributing to Dokploy MCP Server

Thank you for your interest in contributing to Dokploy MCP Server! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:
- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Your environment (OS, Node.js version, etc.)
- Screenshots if applicable

### Suggesting Enhancements

We love feature requests! Please create an issue with:
- A clear, descriptive title
- Detailed explanation of the proposed feature
- Use cases and benefits
- Any potential drawbacks or challenges

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes**:
   - Write clear, concise commit messages
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed
3. **Test your changes**:
   - Ensure the server starts without errors
   - Test all modified functionality
   - Verify no regressions
4. **Submit your PR**:
   - Provide a clear description of changes
   - Reference any related issues
   - Explain your implementation choices

## 📝 Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/dokploy-mcp.git
cd dokploy-mcp

# Install dependencies
bun install

# Start development server
bun run dev
```

## 🎨 Code Style

- Use TypeScript for all code
- Follow existing formatting conventions
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for public APIs

## 🧪 Testing

Before submitting a PR:

```bash
# Test the server locally
bun run dev

# Test with a Dokploy instance
# (Update the config with your test instance)
```

## 📚 Documentation

- Update README.md for new features
- Add JSDoc comments for new functions
- Update API reference for new tools/resources

## 🔄 Commit Messages

Use clear, descriptive commit messages:

```
feat: add support for Docker Compose deployments
fix: resolve issue with environment variable updates
docs: update API reference for new tools
refactor: simplify database creation logic
test: add tests for application deployment
```

Prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## 🚀 Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a new release on GitHub
4. Publish to npm (if applicable)

## 📞 Questions?

- Open a GitHub Discussion
- Join the Smithery Discord
- Join the Dokploy Discord

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints
- Prioritize community well-being

Thank you for contributing! 🎉

