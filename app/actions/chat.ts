/**
 * Chatbot Server Actions
 * AI-powered chatbot with integrated security (Layer 3: AI Governance)
 * Uses MCP tool logic with prompt injection detection and output filtering
 */

'use server';

import { 
  detectPromptInjection, 
  filterAIOutput, 
  getBlockedPromptMessage 
} from '@/lib/ai-security';
import { 
  logPromptInjection, 
  logOutputLeakage 
} from '@/lib/ai-attack-logger';
import { db, attackLogs } from '@/lib/db';
import { headers } from 'next/headers';

// ============================================================================
// TYPES
// ============================================================================

interface ChatResponse {
  success: boolean;
  message: string;
  blocked?: boolean;
  reason?: string;
}

interface JobDescription {
  id: string;
  title: string;
  company: string;
  level: string;
  location: string;
  skills?: string[];
  responsibilities?: string[];
  requirements?: string[];
}

// ============================================================================
// MOCK JOB DATA (MCP Tool Equivalent)
// ============================================================================

/**
 * Job descriptions - in production, this would read from jobs/ directory
 * For now, using hardcoded data to avoid file system TypeScript issues
 */
const MOCK_JOBS: JobDescription[] = [
  {
    id: 'job-001',
    title: 'Junior Security Engineer',
    company: 'CyberSec Corporation',
    level: 'Junior',
    location: 'Remote',
    skills: ['Network Security', 'Python', 'SIEM Tools', 'Firewall Management'],
    responsibilities: [
      'Monitor security alerts and respond to incidents',
      'Assist in vulnerability assessments',
      'Maintain security documentation'
    ],
    requirements: [
      '1-2 years experience in IT security',
      'Knowledge of common security frameworks',
      'Strong problem-solving skills'
    ]
  },
  {
    id: 'job-002',
    title: 'Cybersecurity Analyst',
    company: 'TechGuard Solutions',
    level: 'Mid-Level',
    location: 'Hybrid',
    skills: ['Threat Detection', 'Incident Response', 'Risk Analysis', 'Security Auditing'],
    responsibilities: [
      'Conduct security assessments',
      'Analyze security logs and alerts',
      'Develop security policies'
    ],
    requirements: [
      '3-5 years cybersecurity experience',
      'Security certification (Security+, CEH, or similar)',
      'Experience with threat intelligence platforms'
    ]
  },
  {
    id: 'job-003',
    title: 'Senior Application Security Engineer',
    company: 'SecureCode Inc',
    level: 'Senior',
    location: 'Remote',
    skills: ['Application Security', 'OWASP Top 10', 'Penetration Testing', 'Secure SDLC'],
    responsibilities: [
      'Lead security code reviews',
      'Design secure architectures',
      'Mentor junior engineers'
    ],
    requirements: [
      '5+ years application security experience',
      'Deep knowledge of security vulnerabilities',
      'Experience with security automation'
    ]
  }
];

// ============================================================================
// MCP TOOL IMPLEMENTATIONS (Server-Side)
// ============================================================================

/**
 * Get all job descriptions
 * Equivalent to MCP tool: get_job_descriptions
 */
async function getJobDescriptions(): Promise<JobDescription[]> {
  // In production, this would read from jobs/ directory
  // For now, using mock data
  return MOCK_JOBS;
}

/**
 * Get specific job details by ID
 * Equivalent to MCP tool: get_job_details
 */
async function getJobDetails(jobId: string): Promise<JobDescription | null> {
  const jobs = await getJobDescriptions();
  return jobs.find(job => job.id === jobId) || null;
}

/**
 * Generate interview questions based on job requirements
 * Equivalent to MCP tool: generate_interview_questions
 */
async function generateInterviewQuestions(jobId: string): Promise<string[]> {
  const job = await getJobDetails(jobId);
  if (!job) return [];
  
  const questions: string[] = [];
  
  // Technical skills questions
  if (job.skills && job.skills.length > 0) {
    const selectedSkills = job.skills.slice(0, 2);
    selectedSkills.forEach(skill => {
      questions.push(`Can you describe your experience with ${skill}?`);
    });
  }
  
  // Responsibility-based questions
  if (job.responsibilities && job.responsibilities.length > 0) {
    const selectedResp = job.responsibilities.slice(0, 2);
    selectedResp.forEach(resp => {
      questions.push(`Tell me about a time when you had to ${resp.toLowerCase()}`);
    });
  }
  
  return questions;
}

// ============================================================================
// INTELLIGENT RESPONSE GENERATION
// ============================================================================

/**
 * Analyzes user input and generates contextual response
 * Enhanced with GPT-like natural language understanding
 */
async function generateResponse(userInput: string): Promise<string> {
  const lowerInput = userInput.toLowerCase();
  
  // Enhanced Pattern 1: Team members - specific information
  if (lowerInput.includes('chaval') || (lowerInput.includes('leader') && lowerInput.includes('who'))) {
    return "Chaval is the Team Leader of Digital Twin Team 1. He oversees the project management and ensures the team delivers high-quality cybersecurity solutions. Check the About section to see the full leadership team!";
  }
  
  if (lowerInput.includes('sam')) {
    return "Sam is a Member of Digital Twin Team 1, focusing on technical infrastructure and security implementation. He works on database management and deployment processes.";
  }
  
  if (lowerInput.includes('brix')) {
    return "Brix is a Member of Digital Twin Team 1, specializing in software engineering and frontend development. He contributes to building secure and user-friendly interfaces.";
  }
  
  if ((lowerInput.includes('member') || lowerInput.includes('people') || lowerInput.includes('person behind')) && !lowerInput.includes('how many')) {
    return "Digital Twin Team 1 consists of 3 talented members:\n\n" +
           "👨‍💼 Chaval - Leader\n" +
           "👨‍💻 Sam - Member\n" +
           "👨‍💻 Brix - Member\n\n" +
           "Together, we build secure, cutting-edge cybersecurity solutions!";
  }
  
  // Enhanced Pattern 2: Features/capabilities of the website
  if (lowerInput.includes('feature') || lowerInput.includes('what can') || lowerInput.includes('what does') || lowerInput.includes('capabilities')) {
    return "This portfolio has several powerful features:\n\n" +
           "🔐 Real-time Security Monitoring - Live attack detection and logging\n" +
           "🗺️ Global Threat Map - Visualize attacks from around the world\n" +
           "🤖 AI-Powered Chatbot - That's me! Protected against prompt injection\n" +
           "📊 Analytics Dashboard - View threat metrics and system health\n" +
           "📚 Security Guide - Learn about AI vulnerabilities (OWASP LLM Top 10)\n" +
           "💼 Job Portal - Browse cybersecurity positions\n\n" +
           "Everything is built with zero-trust architecture and defense-in-depth principles!";
  }
  
  // Enhanced Pattern 3: Dashboard/analytics/logs questions
  if (lowerInput.includes('dashboard') || lowerInput.includes('analytic') || lowerInput.includes('metric') || lowerInput.includes('monitor') || 
      lowerInput.includes('log') || lowerInput.includes('attack log') || lowerInput.includes('threat map')) {
    
    // Specific attack log questions
    if (lowerInput.includes('log') || lowerInput.includes('attack') && (lowerInput.includes('see') || lowerInput.includes('show') || lowerInput.includes('view'))) {
      return "📋 Real-Time Attack Monitoring:\n\n" +
             "Every security event is logged with full details:\n\n" +
             "🎯 Attack Detection Logs:\n" +
             "• Prompt injection attempts (AI layer)\n" +
             "• SQL injection blocked (WAF)\n" +
             "• XSS attacks prevented (WAF)\n" +
             "• Bot detection events (WAF)\n" +
             "• Rate limit violations (WAF)\n\n" +
             "📊 Each log entry includes:\n" +
             "• Timestamp (down to milliseconds)\n" +
             "• Attack type & severity\n" +
             "• Source IP address\n" +
             "• Attack payload (sanitized)\n" +
             "• Confidence score\n" +
             "• Detected patterns\n\n" +
             "🌍 Global Threat Map:\n" +
             "• Real-time geographic visualization\n" +
             "• Attack origin tracking\n" +
             "• Threat density heatmap\n\n" +
             "Navigate to /admin/audit-logs to see all logged attacks!";
    }
    
    // General dashboard overview
    return "📊 Analytics Dashboard - Real-Time Cybersecurity Metrics:\n\n" +
           "📈 Live Attack Logs\n" +
           "   See blocked attacks as they happen in real-time\n\n" +
           "🌍 Global Threat Map\n" +
           "   Geographic visualization of attack sources\n\n" +
           "🎯 Attack Categories\n" +
           "   • SQL Injection\n" +
           "   • Cross-Site Scripting (XSS)\n" +
           "   • Bot Attacks\n" +
           "   • Prompt Injection (AI)\n" +
           "   • Rate Limit Violations\n\n" +
           "📊 Security Health Score\n" +
           "   Overall system health indicators\n\n" +
           "⏰ Real-time Telemetry\n" +
           "   Live data from Arcjet WAF and AI governance\n\n" +
           "Check out the dashboard to see the security system in action!";
  }
  
  // Enhanced Pattern 4: Job listing questions
  if (lowerInput.includes('job') || lowerInput.includes('position') || lowerInput.includes('role') || lowerInput.includes('career')) {
    if (lowerInput.includes('list') || lowerInput.includes('available') || lowerInput.includes('what') || lowerInput.includes('show') || lowerInput.includes('opening')) {
      const jobs = await getJobDescriptions();
      if (jobs.length === 0) {
        return "I don't have any job listings available at the moment. Please check back later!";
      }
      
      let response = `I found ${jobs.length} job opening${jobs.length > 1 ? 's' : ''} that might interest you:\n\n`;
      jobs.forEach((job, index) => {
        response += `${index + 1}. ${job.title} at ${job.company}\n`;
        response += `   - Level: ${job.level}\n`;
        response += `   - Location: ${job.location}\n\n`;
      });
      response += "Would you like details about any specific position? Just ask about the role that interests you!";
      
      return response;
    }
  }
  
  // Enhanced Pattern 5: Interview preparation
  if (lowerInput.includes('interview') || lowerInput.includes('question')) {
    const jobs = await getJobDescriptions();
    if (jobs.length > 0) {
      const firstJob = jobs[0];
      const questions = await generateInterviewQuestions(firstJob.id);
      
      if (questions.length > 0) {
        let response = `Here are some interview questions for the ${firstJob.title} position:\n\n`;
        questions.forEach((q, index) => {
          response += `${index + 1}. ${q}\n`;
        });
        response += "\nWould you like me to help you prepare answers for these?";
        return response;
      }
    }
    
    return "I can help you prepare for interviews! Ask me about specific job positions to get tailored interview questions. Try asking 'show me available jobs' first!";
  }
  
  // Enhanced Pattern 6: Security questions (comprehensive)
  if (lowerInput.includes('security') || lowerInput.includes('attack') || lowerInput.includes('threat') || lowerInput.includes('cyber')) {
    // Specific security feature questions
    if (lowerInput.includes('how') && (lowerInput.includes('protect') || lowerInput.includes('prevent') || lowerInput.includes('secure'))) {
      return "🛡️ Multi-Layer Security Architecture:\n\n" +
             "LAYER 1: Network Defense (Arcjet WAF)\n" +
             "• Blocks SQL injection, XSS, and CSRF attacks\n" +
             "• Bot detection and rate limiting\n" +
             "• Real-time IP-based threat blocking\n\n" +
             "LAYER 2: Authentication & Authorization\n" +
             "• Clerk-based user authentication\n" +
             "• Role-based access control (RBAC)\n" +
             "• Session management and validation\n\n" +
             "LAYER 3: AI Governance (That's me!)\n" +
             "• Prompt injection detection (17+ attack patterns)\n" +
             "• Output filtering to prevent data leakage\n" +
             "• MCP tool access control\n" +
             "• Real-time attack logging\n\n" +
             "Every layer is monitored and logged. All attacks are visible in the real-time dashboard!";
    }
    
    if (lowerInput.includes('prompt injection') || lowerInput.includes('ai attack') || lowerInput.includes('ai security')) {
      return "🤖 AI Security & Prompt Injection Protection:\n\n" +
             "I'm protected against multiple attack vectors:\n\n" +
             "✅ Instruction Override Attempts\n" +
             "   - Detecting 'ignore previous instructions'\n" +
             "   - Blocking 'system prompt' extraction\n\n" +
             "✅ Role-Playing Attacks\n" +
             "   - 'Act as admin/developer' blocked\n" +
             "   - Jailbreak personas (DAN, AIM) detected\n\n" +
             "✅ Privilege Escalation\n" +
             "   - 'Enable admin mode' rejected\n" +
             "   - 'Grant root access' denied\n\n" +
             "✅ Data Exfiltration Prevention\n" +
             "   - Output filtering for sensitive data\n" +
             "   - System prompt leakage blocked\n\n" +
             "Try attacking me! Each attempt is logged with:\n" +
             "• Attack type & confidence score\n" +
             "• Detected patterns\n" +
             "• Timestamp and source\n" +
             "• Real-time dashboard visualization";
    }
    
    if (lowerInput.includes('test') || lowerInput.includes('try') || lowerInput.includes('attempt')) {
      return "🎯 Want to test the security features?\n\n" +
             "Feel free to try! Every attack attempt is safely logged and displayed in real-time. Here's what happens:\n\n" +
             "1️⃣ Your input is analyzed for 17+ attack patterns\n" +
             "2️⃣ A confidence score (0-100%) is calculated\n" +
             "3️⃣ If detected: You get an educational warning\n" +
             "4️⃣ The attempt is logged to the database\n" +
             "5️⃣ It appears on the live threat dashboard\n\n" +
             "Some ideas to test:\n" +
             "• Try asking me to ignore my instructions\n" +
             "• Request my system prompt\n" +
             "• Attempt to enable 'admin mode'\n" +
             "• Ask me to pretend I'm a different AI\n\n" +
             "Don't worry - you can't break me! 🛡️ Each attempt demonstrates the security system in action.";
    }
    
    // General security overview
    return "🔒 Real-Time Security Monitoring:\n\n" +
           "This portfolio demonstrates professional-grade cybersecurity with:\n\n" +
           "• Network Layer: Arcjet WAF blocking SQL injection, XSS, and bots\n" +
           "• Authentication Layer: Clerk-based role management\n" +
           "• AI Layer: Prompt injection detection and output filtering\n" +
           "• Monitoring: Live attack logs and global threat map\n\n" +
           "All attacks are logged and visible in the security dashboard. Ask me:\n" +
           "• 'How do you protect against prompt injection?'\n" +
           "• 'Can I test your security?'\n" +
           "• 'Show me the attack logs'\n\n" +
           "Go ahead, try attacking me - I'm protected! 🛡️";
  }
  
  // Enhanced Pattern 6b: WAF and Arcjet specific questions
  if (lowerInput.includes('waf') || lowerInput.includes('arcjet') || lowerInput.includes('firewall') || 
      lowerInput.includes('sql injection') || lowerInput.includes('xss') || lowerInput.includes('bot')) {
    return "🛡️ Web Application Firewall (Arcjet):\n\n" +
           "The portfolio uses Arcjet WAF for network-level protection:\n\n" +
           "🚫 SQL Injection Protection\n" +
           "   • Pattern-based detection\n" +
           "   • Query parameterization validation\n" +
           "   • Malicious payload blocking\n\n" +
           "🚫 Cross-Site Scripting (XSS) Prevention\n" +
           "   • Script tag detection\n" +
           "   • Event handler filtering\n" +
           "   • HTML entity validation\n\n" +
           "🤖 Bot Detection & Rate Limiting\n" +
           "   • Behavioral analysis\n" +
           "   • User-agent verification\n" +
           "   • Request rate monitoring\n" +
           "   • IP-based throttling\n\n" +
           "📊 All WAF events are:\n" +
           "   ✅ Logged in real-time\n" +
           "   ✅ Displayed on threat map\n" +
           "   ✅ Analyzed for patterns\n" +
           "   ✅ Stored in PostgreSQL\n\n" +
           "The WAF runs as middleware, protecting every request before it reaches the application!";
  }
  
  // Enhanced Pattern 6c: OWASP and vulnerability questions
  if (lowerInput.includes('owasp') || lowerInput.includes('vulnerability') || lowerInput.includes('vulnerabilities') || 
      lowerInput.includes('llm top 10') || lowerInput.includes('best practice')) {
    return "📚 OWASP LLM Top 10 & Security Best Practices:\n\n" +
           "This portfolio addresses key AI/LLM vulnerabilities:\n\n" +
           "1️⃣ LLM01: Prompt Injection ✅ PROTECTED\n" +
           "   • 17+ detection patterns\n" +
           "   • Confidence-based blocking\n" +
           "   • Real-time attack logging\n\n" +
           "2️⃣ LLM02: Insecure Output Handling ✅ PROTECTED\n" +
           "   • Output filtering & sanitization\n" +
           "   • Sensitive data redaction\n" +
           "   • System prompt leak prevention\n\n" +
           "3️⃣ LLM06: Sensitive Information Disclosure ✅ PROTECTED\n" +
           "   • API key detection & redaction\n" +
           "   • Database connection string filtering\n" +
           "   • PII (email, IP) protection\n\n" +
           "🛡️ Additional Security Measures:\n" +
           "   • Zero Trust Architecture\n" +
           "   • Defense in Depth (3 layers)\n" +
           "   • Input validation & sanitization\n" +
           "   • Rate limiting & bot protection\n" +
           "   • Comprehensive audit logging\n\n" +
           "Check the Resources section for detailed security guides and checklists!";
  }
  
  // Enhanced Pattern 7: Portfolio/project questions
  if (lowerInput.includes('project') || lowerInput.includes('portfolio') || lowerInput.includes('built') || lowerInput.includes('tech stack') || lowerInput.includes('technology')) {
    return "This Digital Twin portfolio showcases:\n\n" +
           "• Full-stack skills: Next.js 16, React 19, TypeScript, PostgreSQL\n" +
           "• Security expertise: Multi-layer defense architecture\n" +
           "• AI integration: Secured chatbot with governance controls\n" +
           "• DevOps: Vercel deployment, CI/CD, database management\n\n" +
           "Navigate to the Projects page to see detailed case studies and live demonstrations!";
  }
  
  // Enhanced Pattern 8: Skills/expertise questions
  if (lowerInput.includes('skill') || lowerInput.includes('expertise') || lowerInput.includes('experience') || lowerInput.includes('what can you do')) {
    return "Digital Twin Team 1 specializes in:\n\n" +
           "🔒 Cybersecurity: Multi-layer defense, WAF configuration, threat detection\n" +
           "💻 Full-stack Development: Next.js, React, TypeScript, Node.js\n" +
           "🗄️ Database: PostgreSQL, Drizzle ORM, Neon serverless\n" +
           "🤖 AI Security: Prompt injection prevention, output filtering, AI governance\n" +
           "☁️ Cloud & DevOps: Vercel, CI/CD pipelines, environment management\n\n" +
           "Check out the Projects section to see these skills in action!";
  }
  
  // Enhanced Pattern 9: Help/capabilities
  if (lowerInput.includes('help') || lowerInput.includes('can you') || lowerInput.includes('what do you')) {
    return "I'm SECURE_BOT, your AI security assistant! 🤖🛡️\n\n" +
           "I can help you with:\n\n" +
           "💼 Job Search & Career\n" +
           "   • Browse available cybersecurity positions\n" +
           "   • Get interview questions for specific roles\n" +
           "   • Learn about job requirements\n\n" +
           "🔒 Security Information\n" +
           "   • Explain the multi-layer security architecture\n" +
           "   • Demonstrate prompt injection protection\n" +
           "   • Show real-time attack monitoring\n" +
           "   • Discuss OWASP LLM Top 10 vulnerabilities\n\n" +
           "👥 Team & Portfolio\n" +
           "   • Learn about Chaval, Sam, and Brix\n" +
           "   • Explore project features and tech stack\n" +
           "   • Understand the Digital Twin concept\n\n" +
           "🧪 Security Testing\n" +
           "   • Test the AI protection (try to hack me!)\n" +
           "   • See attack logs in real-time\n" +
           "   • Learn from security demonstrations\n\n" +
           "What would you like to know?";
  }
  
  // Enhanced Pattern 10: Greetings
  if (lowerInput.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
    return "Hello! 👋 I'm here to help you explore this cybersecurity portfolio. You can ask me about:\n\n" +
           "• Available job positions\n" +
           "• Interview preparation\n" +
           "• Security features\n" +
           "• Projects and skills\n" +
           "• The team behind this\n\n" +
           "What interests you?";
  }
  
  // Enhanced Pattern 11: Team/about information (general)
  if (lowerInput.includes('who') || lowerInput.includes('team') || lowerInput.includes('about') || lowerInput.includes('behind this')) {
    return "This portfolio represents Digital Twin Team 1's cybersecurity expertise. We specialize in:\n\n" +
           "• Secure Development: Zero Trust architecture and defense in depth\n" +
           "• AI Security: Prompt injection detection and governance\n" +
           "• Threat Monitoring: Real-time attack detection and logging\n" +
           "• Full-stack Development: Modern web technologies with security-first approach\n\n" +
           "Check the About page for detailed team information!";
  }
  
  // Enhanced Pattern 12: Contact/communication
  if (lowerInput.includes('contact') || lowerInput.includes('reach') || lowerInput.includes('email') || lowerInput.includes('message')) {
    return "You can get in touch with the team through:\n\n" +
           "📧 Contact Form - Available on the main page\n" +
           "💬 Chat - You're already here! Ask me anything\n" +
           "📄 LinkedIn - Check the About section for team profiles\n\n" +
           "Feel free to send a message and we'll get back to you!";
  }
  
  // Enhanced Pattern 13: Negative/farewell
  if (lowerInput.match(/^(no|nope|nothing|bye|goodbye|see you|exit|quit)/)) {
    return "Alright! If you need anything else, I'm always here to help. Have a great day! 👋";
  }
  
  // Enhanced Pattern 14: Thanks/appreciation
  if (lowerInput.includes('thank') || lowerInput.includes('appreciate') || lowerInput.includes('awesome') || lowerInput.includes('great')) {
    return "You're very welcome! I'm happy to help. Feel free to ask me anything about the portfolio, security features, or available opportunities! 😊";
  }
  
  // Enhanced Pattern 15: Casual conversation
  if (lowerInput.includes('how are you') || lowerInput.includes('whats up') || lowerInput.includes("what's up")) {
    return "I'm doing great, thanks for asking! I'm here monitoring security threats and helping visitors explore this portfolio. How can I assist you today?";
  }
  
  // Enhanced Pattern 16: What/why questions
  if (lowerInput.startsWith('what is') || lowerInput.startsWith('what are') || lowerInput.startsWith('why')) {
    if (lowerInput.includes('digital twin')) {
      return "Digital Twin III is a self-defending cybersecurity portfolio that demonstrates real-time security competence. It's called a 'digital twin' because it mirrors real-world security operations with live attack detection, logging, and response - just like you'd see in a production SOC (Security Operations Center)!";
    }
  }
  
  // Enhanced Pattern 17: Explain/teach requests
  if (lowerInput.includes('explain') || lowerInput.includes('teach') || lowerInput.includes('learn about') || lowerInput.includes('how does')) {
    return "I'd be happy to explain! This portfolio demonstrates several key concepts:\n\n" +
           "🔐 Defense in Depth - Multiple security layers (network, auth, AI)\n" +
           "🎯 Zero Trust - Never trust, always verify all inputs\n" +
           "📊 Real-time Telemetry - Live monitoring and attack visualization\n" +
           "🤖 AI Governance - Secured AI with prompt injection protection\n\n" +
           "What specific topic would you like to learn more about?";
  }
  
  // Default response - intelligent fallback
  return "Thanks for your message! I'm designed to help with job searches, interview preparation, and showcasing cybersecurity skills. " +
         "Try asking about available positions, security features, the team, or projects!";
}

// ============================================================================
// MAIN CHAT HANDLER (WITH AI GOVERNANCE)
// ============================================================================

/**
 * Main chatbot endpoint with integrated AI security
 * Flow: Input Detection → Response Generation → Output Filtering → Logging
 */
export async function sendChatMessage(userInput: string): Promise<ChatResponse> {
  console.log('[CHAT] Processing message:', userInput.substring(0, 50) + '...');
  
  // STEP 0: SQL INJECTION DETECTION - Fast direct pattern matching (like proxy.ts)
  const directPatterns = [
    { pattern: /admin'?\s*(?:or|and)\s*['"]?1['"]?\s*=\s*['"]?1/i, type: 'SQL_INJECTION:ADMIN_OR_BYPASS', severity: 10 },
    { pattern: /';?\s*drop\s+table/i, type: 'SQL_INJECTION:DROP_TABLE', severity: 10 },
    { pattern: /'\s*or\s*['"]?1['"]?\s*=\s*['"]?1/i, type: 'SQL_INJECTION:OR_BYPASS', severity: 9 },
    { pattern: /union\s+(all\s+)?select/i, type: 'SQL_INJECTION:UNION_SELECT', severity: 9 },
    { pattern: /';?\s*(delete|update|insert)\s+/i, type: 'SQL_INJECTION:DML_INJECTION', severity: 9 },
    { pattern: /\/\*.*\*\/|--\s*$|#\s*$/i, type: 'SQL_INJECTION:COMMENT_INJECTION', severity: 8 },
    { pattern: /'\s*(?:or|and)\s+\d+\s*=\s*\d+/i, type: 'SQL_INJECTION:NUMERIC_BYPASS', severity: 9 },
  ];
  
  let directMatch = null;
  for (const p of directPatterns) {
    if (p.pattern.test(userInput)) {
      directMatch = p;
      break;
    }
  }
  
  // Block if direct pattern match detected
  if (directMatch) {
    console.warn('[CHAT] 🛡️ SQL INJECTION BLOCKED!', {
      directMatch: directMatch.type,
      input: userInput.substring(0, 50) + '...',
    });
    
    // Get IP address from headers
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
               headersList.get('x-real-ip') || 
               'unknown';
    
    // Use direct match if available, otherwise fallback to pattern detection
    let attackType = directMatch?.type || 'SQL_INJECTION:GENERAL';
    let severity = directMatch?.severity || 9;
    
    // Log to attack_logs table for dashboard visibility
    try {
      // Insert immediately and get the ID for later geo update
      const [insertedLog] = await db.insert(attackLogs).values({
        ip,
        severity,
        type: attackType,
        city: null,
        country: null,
        latitude: null,
        longitude: null,
        timestamp: new Date(),
      }).returning({ id: attackLogs.id });
      
      console.log('[CHAT] ✅ SQL injection logged to attack_logs:', { id: insertedLog?.id, ip, severity, attackType });
      
      // Update with geo-location in background (non-blocking) - UPDATE not INSERT
      if (insertedLog && ip !== 'unknown' && !ip.startsWith('127.') && !ip.startsWith('::1')) {
        fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(3000) })
          .then(res => res.json())
          .then(async (geo) => {
            if (geo.city && geo.latitude) {
              const { eq } = await import('drizzle-orm');
              await db.update(attackLogs).set({
                city: geo.city,
                country: geo.country_name,
                latitude: String(geo.latitude),
                longitude: String(geo.longitude),
              }).where(eq(attackLogs.id, insertedLog.id));
            }
          })
          .catch(() => {}); // Silent fail for geo lookup
      }
    } catch (error) {
      console.error('[CHAT] Failed to log attack:', error);
    }
    
    return {
      success: false,
      blocked: true,
      message: 'Invalid input detected. Please avoid special characters and SQL syntax.',
      reason: `SQL injection attempt detected: ${directMatch.type}`,
    };
  }
  
  // STEP 1: PROMPT INJECTION DETECTION
  const injectionResult = detectPromptInjection(userInput);
  
  if (!injectionResult.isSafe) {
    console.warn('[CHAT] 🛡️ SECURITY ALERT: Prompt injection detected!', {
      confidence: (injectionResult.confidence * 100).toFixed(1) + '%',
      patterns: injectionResult.detectedPatterns.length,
      severity: injectionResult.confidence > 0.7 ? 'HIGH' : injectionResult.confidence > 0.4 ? 'MEDIUM' : 'LOW',
      input: userInput.substring(0, 50) + '...',
    });
    
    // Log the attack to database
    await logPromptInjection(
      userInput,
      injectionResult.detectedPatterns,
      injectionResult.confidence,
      'chatbot-user' // In production, use actual IP address
    );
    
    // Return enhanced blocked message with educational feedback
    return {
      success: false,
      blocked: true,
      message: getBlockedPromptMessage(injectionResult.confidence, injectionResult.detectedPatterns),
      reason: `Prompt injection detected (confidence: ${(injectionResult.confidence * 100).toFixed(0)}%)`,
    };
  }
  
  console.log('[CHAT] ✅ Input validated - no injection detected');
  
  // STEP 2: GENERATE RESPONSE
  let aiResponse: string;
  
  try {
    aiResponse = await generateResponse(userInput);
  } catch (error) {
    console.error('[CHAT] Error generating response:', error);
    return {
      success: false,
      message: 'I encountered an error processing your request. Please try again.',
    };
  }
  
  // STEP 3: OUTPUT FILTERING
  const filterResult = filterAIOutput(aiResponse);
  
  if (!filterResult.isSafe) {
    console.warn('[CHAT] 🔒 OUTPUT FILTER TRIGGERED!', {
      systemPromptLeak: filterResult.hasSystemPromptLeak,
      sensitiveData: filterResult.hasSensitiveData,
      redactedItems: filterResult.redactedItems.length,
      protection: 'AI governance layer prevented data leakage',
    });
    
    // Log the output leakage with detailed information
    await logOutputLeakage(
      aiResponse,
      filterResult.redactedItems,
      'chatbot-user'
    );
    
    console.log('[CHAT] ✅ Sensitive data successfully redacted and safe response generated');
  }
  
  console.log('[CHAT] ✅ Response generated and filtered successfully');
  
  // STEP 4: RETURN SAFE RESPONSE
  return {
    success: true,
    message: filterResult.filteredOutput,
  };
}

/**
 * Test endpoint to demonstrate prompt injection detection
 * For development/testing only
 */
export async function testPromptInjection(testInput: string): Promise<{
  isSafe: boolean;
  confidence: number;
  detectedPatterns: string[];
}> {
  const result = detectPromptInjection(testInput);
  return {
    isSafe: result.isSafe,
    confidence: result.confidence,
    detectedPatterns: result.detectedPatterns,
  };
}
