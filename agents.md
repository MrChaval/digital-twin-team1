### Instruction manual
### AI Agent Instructions
1. Project Context
You are an AI assistant helping build the Digital Twin III: Cyber-Hardened Portfolio. The goal is a self-defending digital identity that demonstrates cybersecurity competence through real-time telemetry.

2. Technical Stack & Standards
Framework: Next.js 16 (App Router).

Writes: Use only authenticated Server Actions. No REST API endpoints for writes unless specified.

Database: Use Drizzle ORM for all Postgres interactions to prevent raw SQL injection.

Security: Integrate Arcjet WAF rules for bot protection and rate-limiting.

3. Critical Constraints
Zero Trust: Assume all user input is malicious. Always implement input validation and sanitization.

AI Governance: AI tools (MCP) must never have permission to modify security configurations or administrative session logic.

Errors: Never expose stack traces or internal metadata to the client.

4. MCP & Tool Calling
Interview Simulation: Use the job descriptions stored in the repository to simulate hiring scenarios.

Content Updates: Content added via MCP must be logged and validated before being committed to Neon Postgres.

5. Reference Documentation
PRD: docs/prd.md

Design: docs/design.md

Implementation history: docs/dev_log.md

6. Log history
Every time you take action please add a detailed description note into: docs/dev_log.md
Do not delete the existing log inside, adding the new line, references time stamp, and who push into the Github.
You can read the log inside the docs/dev_log.md for reference before the deployment.
