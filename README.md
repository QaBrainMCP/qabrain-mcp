# QaBrainMCP

> AI-powered QA Intelligence Platform built on the Model Context Protocol (MCP)

![Node](https://img.shields.io/badge/Node.js-22+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![License](https://img.shields.io/badge/License-Apache%202.0-blue)
![Playwright](https://img.shields.io/badge/Playwright-Latest-brightgreen)
![MCP](https://img.shields.io/badge/MCP-Compatible-purple)

---

## 🚀 What is QaBrainMCP?

QaBrainMCP is an AI-powered QA Intelligence Platform that learns web applications instead of simply automating them.

Unlike traditional automation frameworks, QaBrain builds a knowledge graph of:

- Pages
- Navigation
- Forms
- Components
- Buttons
- Tables
- Workflows
- Relationships

This knowledge can later be used for:

- Requirement Mapping
- Coverage Analysis
- Impact Analysis
- AI-assisted Test Design
- Application Understanding

---

# Features

- ✅ Model Context Protocol (MCP) Server
- ✅ Playwright Integration
- ✅ Application Learning
- ✅ Knowledge Graph
- ✅ Requirement Mapping
- ✅ Coverage Analysis
- ✅ Impact Analysis
- ✅ Browser Intelligence
- ✅ Environment-based Configuration
- ✅ CLI Support

---

# Architecture

```text
GitHub Copilot / ChatGPT / Claude Desktop
                    │
                    ▼
             QaBrain MCP Server
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
Knowledge Engine         Requirement Engine
        │
        ▼
 Application Explorer
        │
        ▼
 Browser Intelligence
        │
        ▼
      Playwright
        │
        ▼
 Target Application
```

---

# Requirements

- Node.js 22+
- npm 10+

---

# Installation

Clone the repository

```bash
git clone https://github.com/Soumyaqa1997/qabrain-mcp.git

cd qabrain-mcp
```

Install dependencies

```bash
npm install
```

Create environment file

```bash
copy .env.example .env
```

Windows users can simply run:

```bash
setup.bat
```

Linux/macOS

```bash
chmod +x setup.sh

./setup.sh
```

---

# Configuration

Example `.env`

```env
APP_NAME=QaBrainMCP
APP_VERSION=1.0.0

TARGET_APP_NAME=OrangeHRM
TARGET_APP_URL=https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
TARGET_APP_USERNAME=Admin
TARGET_APP_PASSWORD=admin123

BROWSER=chromium
HEADLESS=false

LOG_LEVEL=info

NODE_ENV=development

MCP_HOST=127.0.0.1
MCP_PORT=3001

ENABLE_DEBUG=false
```

---

# Quick Start

Build

```bash
npm run build
```

Verify installation

```bash
node dist/cli/index.js doctor
```

Expected

```text
QaBrain Doctor

Configuration is valid.
```

Start QaBrain

```bash
npm start
```

---

# Supported MCP Clients

QaBrainMCP can be connected to any MCP-compatible client, including:

- GitHub Copilot
- ChatGPT Desktop
- Claude Desktop
- Cursor
- Windsurf

MCP is an open protocol designed to let AI applications interact with external tools and services. :contentReference[oaicite:0]{index=0}

---

# Available MCP Tools

| Tool | Description |
|------|-------------|
| learn_application | Learn an application |
| map_requirement | Map requirements to UI |
| analyze_coverage | Analyze test coverage |
| analyze_impact | Analyze UI impact |
| ask_qabrain | Query learned knowledge |
| build_knowledge_graph | Build Knowledge Graph |
| query_knowledge_graph | Query Knowledge Graph |
| create_snapshot | Create application snapshot |
| compare_snapshots | Compare snapshots |
| learn_incrementally | Incremental learning |
| reason_about_requirement | AI reasoning |

---

# Example

Learn OrangeHRM

```json
{
  "application": "OrangeHRM"
}
```

QaBrain will:

- Launch Playwright
- Open OrangeHRM
- Login
- Discover navigation
- Learn pages
- Discover components
- Build application knowledge

---

# Development

Build

```bash
npm run build
```

Run

```bash
npm start
```

Development Mode

```bash
npm run dev
```

Run Tests

```bash
npm test
```

Type Check

```bash
npm run typecheck
```

Lint

```bash
npm run lint
```

---

# Project Structure

```text
src/
 ├── application/
 ├── browser/
 ├── cli/
 ├── config/
 ├── knowledge/
 ├── locator/
 ├── mcp/
 ├── workflow/
 └── utils/
```

---

# Roadmap

- Generic Web Application Learning
- Azure DevOps Connector
- Jira Connector
- Salesforce Adapter
- ServiceNow Adapter
- Workday Adapter
- AI Test Case Generation
- AI Impact Prediction
- Enterprise Dashboard

---

# Troubleshooting

If something doesn't work:

```bash
node dist/cli/index.js doctor
```

Then verify:

- `.env`
- Node.js version
- `npm run build`
- Browser installation

---

# License

Apache-2.0

---

# Author

**Soumya Ranjan Lenka**

QA Automation Engineer

GitHub: **https://github.com/Soumyaqa1997**

Creator of **QaBrainMCP**