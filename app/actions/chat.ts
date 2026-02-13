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
 * Uses pattern matching to detect intent and call appropriate tools
 */
async function generateResponse(userInput: string): Promise<string> {
  const lowerInput = userInput.toLowerCase();
  
  // Pattern 1: Job listing questions
  if (lowerInput.includes('job') || lowerInput.includes('position') || lowerInput.includes('role')) {
    if (lowerInput.includes('list') || lowerInput.includes('available') || lowerInput.includes('what') || lowerInput.includes('show')) {
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
      response += "Would you like details about any specific position?";
      
      return response;
    }
  }
  
  // Pattern 2: Interview preparation
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
    
    return "I can help you prepare for interviews! Ask me about specific job positions to get tailored interview questions.";
  }
  
  // Pattern 3: Security questions
  if (lowerInput.includes('security') || lowerInput.includes('attack') || lowerInput.includes('threat')) {
    return "This portfolio demonstrates real-time security monitoring with:\n\n" +
           "• Network Layer: Arcjet WAF blocking SQL injection, XSS, and bots\n" +
           "• Authentication Layer: Clerk-based role management\n" +
           "• AI Layer: Prompt injection detection and output filtering\n\n" +
           "All attacks are logged and visible in the security dashboard. Try attacking me - I'm protected! 🛡️";
  }
  
  // Pattern 4: Portfolio/project questions
  if (lowerInput.includes('project') || lowerInput.includes('portfolio') || lowerInput.includes('built')) {
    return "This Digital Twin portfolio showcases:\n\n" +
           "• Full-stack skills: Next.js 16, React 19, TypeScript, PostgreSQL\n" +
           "• Security expertise: Multi-layer defense architecture\n" +
           "• AI integration: Secured chatbot with governance controls\n" +
           "• DevOps: Vercel deployment, CI/CD, database management\n\n" +
           "Navigate to the Projects page to see detailed case studies!";
  }
  
  // Pattern 5: Help/capabilities
  if (lowerInput.includes('help') || lowerInput.includes('can you') || lowerInput.includes('what do you')) {
    return "I'm SECURE_BOT, your AI security assistant! I can help you with:\n\n" +
           "• Job Search: Ask me about available positions\n" +
           "• Interview Prep: Get interview questions for specific roles\n" +
           "• Security Info: Learn about the security features in this portfolio\n" +
           "• Projects: Discover what technologies and skills are showcased here\n\n" +
           "What would you like to know?";
  }
  
  // Pattern 6: Greetings
  if (lowerInput.match(/^(hi|hello|hey|greetings|good morning|good afternoon)/)) {
    return "Hello! 👋 I'm here to help you explore this cybersecurity portfolio. You can ask me about:\n\n" +
           "• Available job positions\n" +
           "• Interview preparation\n" +
           "• Security features\n" +
           "• Projects and skills\n\n" +
           "What interests you?";
  }
  
  // Pattern 7: Team/about information
  if (lowerInput.includes('who') || lowerInput.includes('team') || lowerInput.includes('about')) {
    return "This portfolio represents Digital Twin Team 1's cybersecurity expertise. We specialize in:\n\n" +
           "• Secure Development: Zero Trust architecture and defense in depth\n" +
           "• AI Security: Prompt injection detection and governance\n" +
           "• Threat Monitoring: Real-time attack detection and logging\n" +
           "• Full-stack Development: Modern web technologies with security-first approach\n\n" +
           "Check the About page for detailed team information!";
  }
  
  // Default response - intelligent fallback
  return "Thanks for your message! I'm designed to help with job searches, interview preparation, and showcasing cybersecurity skills. " +
         "Try asking about available positions, security features, or projects!";
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
  
  // STEP 1: PROMPT INJECTION DETECTION
  const injectionResult = detectPromptInjection(userInput);
  
  if (!injectionResult.isSafe) {
    console.warn('[CHAT] ⚠️ Prompt injection detected!', {
      confidence: injectionResult.confidence,
      patterns: injectionResult.detectedPatterns.length,
    });
    
    // Log the attack to database
    await logPromptInjection(
      userInput,
      injectionResult.detectedPatterns,
      injectionResult.confidence,
      'chatbot-user' // In production, use actual IP address
    );
    
    // Return blocked message
    return {
      success: false,
      blocked: true,
      message: getBlockedPromptMessage(),
      reason: 'Prompt injection detected',
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
    console.warn('[CHAT] ⚠️ Output filtering triggered!', {
      systemPromptLeak: filterResult.hasSystemPromptLeak,
      sensitiveData: filterResult.hasSensitiveData,
      redactedItems: filterResult.redactedItems.length,
    });
    
    // Log the output leakage
    await logOutputLeakage(
      aiResponse,
      filterResult.redactedItems,
      'chatbot-user'
    );
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
