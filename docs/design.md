This document serves as the technical blueprint for  Digital Twin III project

### Technical Design: Cyber-Hardened Digital Twin Portfolio
1. System Architecture Overview
The system follows a six-layer defense-in-depth architecture to ensure resilience against adversarial attacks while maintaining high-fidelity professional representation.

Layers:
Edge/Network Defense: Arcjet WAF and Vercel Firewall for bot detection and rate-limiting.

UI Layer: Next.js 16 App Router with Shadcn components, designed to guide users toward safe paths.

Application Logic: Authenticated Server Actions for all data manipulation, ensuring no raw API exposure.

Governance Layer: Vercel AI SDK and MCP tool-calling with strict input sanitization and command guardrails.

Persistence Layer: Neon Postgres with Drizzle ORM for type-safe, parameterized SQL queries.

Intelligence Layer: Threat Telemetry Dashboard and automated incident logging.

2. Data Flow and Security Boundaries
User/Attacker Input: Captured at the edge; Arcjet analyzes for SQLi or Prompt Injection patterns.

Server Actions: Validate session identity and sanitize payloads before interacting with the database.

AI Integration: AI agents use MCP to update content but are restricted from modifying security rules or PII.

3. Component Design
3.1 Ethical Hacking Zone
SQLi Sandbox: A controlled form using a read-only database user to demonstrate parameterization defenses.

Prompt Injection Playground: A sandbox where users attempt to bypass AI rules, logged by the governance layer.

3.2 Threat Telemetry Dashboard
Live Status Component: Real-time threat level (Secure, Elevated, Under Attack) based on Arcjet telemetry.

Incident Feed: A streaming log of neutralized threats with severity scoring.

4. Technical Stack
Framework: Next.js 16+.

Database: Neon Postgres + Drizzle ORM.

Security: Arcjet WAF + Vercel Firewall.

AI: Vercel AI SDK + MCP.

Communications: Resend API for security alerts.