# Job Descriptions for Interview Simulation

This folder contains job descriptions used by the MCP (Model Context Protocol) server for interview simulation features.

## Purpose

The Digital Twin chatbot uses these job descriptions to:
- Simulate technical interviews based on real job requirements
- Generate relevant interview questions
- Assess candidate responses against job requirements
- Provide personalized interview preparation

## File Structure

Each job description is stored as a JSON file with the following schema:

```json
{
  "id": "unique-job-id",
  "title": "Job Title",
  "company": "Company Name",
  "location": "Location",
  "type": "Full-time | Part-time | Contract",
  "level": "Entry-Level | Mid-Level | Senior | Lead",
  "description": "Brief job overview",
  "responsibilities": ["list", "of", "responsibilities"],
  "requirements": ["list", "of", "requirements"],
  "skills": ["list", "of", "required", "skills"],
  "salary": "Salary range",
  "posted": "YYYY-MM-DD",
  "expires": "YYYY-MM-DD"
}
```

## Current Job Descriptions

1. **cybersecurity-analyst.json** - Mid-level position focusing on threat detection and incident response
2. **junior-security-engineer.json** - Entry-level role for recent graduates
3. **senior-application-security-engineer.json** - Senior position for AppSec specialists

## Adding New Jobs

To add a new job description:

1. Create a new JSON file following the schema above
2. Use kebab-case for filename (e.g., `penetration-tester.json`)
3. Ensure the `id` field is unique
4. Include realistic responsibilities, requirements, and skills

## MCP Integration

The MCP server will:
- Read job descriptions from this folder
- Parse JSON data for interview simulation
- Match user skills against job requirements
- Generate interview questions based on required skills
- Provide feedback on interview responses

## Security Considerations

- Job descriptions are read-only for the MCP server
- No sensitive company data should be included
- Use placeholder company names if needed
- Keep salary ranges realistic but general
