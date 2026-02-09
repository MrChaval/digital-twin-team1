# Digital Twin MCP Server

Model Context Protocol (MCP) server for the Digital Twin portfolio project. Provides AI tools for interview simulation and portfolio data access.

## Overview

This MCP server exposes tools that AI assistants can use to:
- Simulate technical interviews based on real job descriptions
- Generate role-specific interview questions
- Access portfolio project data
- Demonstrate MCP implementation patterns

## Installation

```bash
cd src/mcp-server
npm install
```

## Available Tools

### 1. `rolldice`
**Purpose:** Example MCP tool pattern (Week 3 requirement)  
**Description:** Rolls a dice with specified number of sides (2-100)

**Example:**
```javascript
{
  "name": "rolldice",
  "arguments": { "sides": 20 }
}
```

**Response:**
```json
{
  "sides": 20,
  "result": 14,
  "message": "🎲 Rolled a 20-sided dice: 14"
}
```

---

### 2. `get_job_descriptions`
**Purpose:** List all available job positions  
**Description:** Returns summary of all job descriptions in the `jobs/` folder

**Example:**
```javascript
{
  "name": "get_job_descriptions",
  "arguments": {}
}
```

**Response:**
```json
{
  "count": 3,
  "jobs": [
    {
      "id": "job-001",
      "title": "Cybersecurity Analyst",
      "company": "Tech Solutions Inc.",
      "level": "Mid-Level",
      "location": "Remote"
    }
  ]
}
```

---

### 3. `get_job_details`
**Purpose:** Get full job description  
**Description:** Returns complete details for a specific job including responsibilities, requirements, skills, and salary

**Example:**
```javascript
{
  "name": "get_job_details",
  "arguments": { "jobId": "job-001" }
}
```

**Response:**
```json
{
  "id": "job-001",
  "title": "Cybersecurity Analyst",
  "description": "...",
  "responsibilities": [...],
  "requirements": [...],
  "skills": [...],
  "salary": "$75,000 - $110,000"
}
```

---

### 4. `generate_interview_questions`
**Purpose:** Interview simulation  
**Description:** Generates interview questions based on job requirements and skills

**Example:**
```javascript
{
  "name": "generate_interview_questions",
  "arguments": { "jobId": "job-001" }
}
```

**Response:**
```json
{
  "jobTitle": "Cybersecurity Analyst",
  "company": "Tech Solutions Inc.",
  "totalQuestions": 7,
  "questions": [
    {
      "category": "Technical",
      "question": "Can you describe your experience with Network Security?",
      "skill": "Network Security"
    },
    {
      "category": "Behavioral",
      "question": "Tell me about a time when you had to: monitor security alerts and investigate potential security incidents",
      "responsibility": "Monitor security alerts..."
    }
  ]
}
```

## Running the Server

### Standalone (for testing)
```bash
npm start
```

### With VS Code MCP Integration
Add to `.vscode/mcp.json`:
```json
{
  "mcpServers": {
    "digital-twin": {
      "command": "node",
      "args": ["src/mcp-server/index.js"]
    }
  }
}
```

## Development

### Watch mode (auto-reload on changes)
```bash
npm run dev
```

### Testing Tools Manually

You can test the MCP server using the Model Context Protocol inspector or by invoking it from AI tools like Claude Desktop or VS Code with MCP support.

## Architecture

```
src/mcp-server/
├── index.js          # Main MCP server
├── package.json      # Dependencies and scripts
└── README.md         # This file

jobs/                 # Job description data (read by MCP tools)
├── cybersecurity-analyst.json
├── junior-security-engineer.json
└── senior-application-security-engineer.json
```

## Use Cases

### Interview Preparation
AI chatbot: "Help me prepare for a cybersecurity analyst interview"
1. Calls `get_job_descriptions()` → Shows available positions
2. User selects job → Calls `get_job_details(jobId)`
3. Calls `generate_interview_questions(jobId)` → Generates questions
4. User practices answers → AI provides feedback

### Portfolio Navigation
AI chatbot: "Tell me about the team's cybersecurity skills"
- Reads job descriptions to understand required skills
- Matches with portfolio projects
- Provides context-aware responses

## Security Considerations

- **Read-only access:** MCP server only reads job files, never writes
- **Input validation:** All tool arguments are validated
- **Error handling:** Graceful error messages, no sensitive data exposure
- **Sandboxed:** MCP tools cannot modify security configs (per agents.md)

## Week 3 Requirements

✅ **Rolldice pattern implementation** - `rolldice` tool demonstrates MCP pattern  
✅ **Interview simulation** - `generate_interview_questions` tool  
✅ **Job data integration** - Reads from `jobs/` folder  
✅ **Multiple tools** - 4 distinct MCP tools implemented

## Next Steps

1. Configure `.vscode/mcp.json` to connect MCP server to VS Code
2. Update `agents.md` with MCP usage instructions
3. Integrate chatbot UI with MCP tools
4. Add more interview simulation features (CodeWhisperer integration, etc.)

## Dependencies

- `@modelcontextprotocol/sdk` - Official MCP SDK for Node.js
- `Node.js` >= 18.0.0

## License

MIT - Digital Twin Team 1
