/**
 * AI Security Library
 * Protects against prompt injection, output leakage, and malicious AI interactions
 * Part of Layer 3: AI Governance
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PromptInjectionResult {
  isSafe: boolean;
  confidence: number; // 0-1, higher means more confident it's an attack
  detectedPatterns: string[];
  sanitizedInput?: string;
}

export interface OutputFilterResult {
  isSafe: boolean;
  hasSystemPromptLeak: boolean;
  hasSensitiveData: boolean;
  filteredOutput: string;
  redactedItems: string[];
}

export interface MCPToolCallValidation {
  isValid: boolean;
  toolName: string;
  reason?: string;
}

// ============================================================================
// PROMPT INJECTION DETECTION PATTERNS
// ============================================================================

/**
 * Common prompt injection attack patterns
 * Based on OWASP LLM Top 10 and real-world attacks
 */
const PROMPT_INJECTION_PATTERNS = [
  // ========== INSTRUCTION OVERRIDE ATTEMPTS ==========
  /ignore\s+(previous|all|above|prior|earlier)\s+(instructions|prompts|rules|commands|text)/i,
  /disregard\s+(previous|all|above|prior|earlier)\s+(instructions|prompts|rules|commands)/i,
  /forget\s+(previous|all|above|prior|earlier)\s+(instructions|prompts|rules|everything)/i,
  /skip\s+(previous|all|above|prior)\s+(instructions|prompts|rules)/i,
  /override\s+(previous|all|prior)\s+(instructions|prompts|rules|settings)/i,
  /bypass\s+(previous|all|prior)\s+(instructions|prompts|rules|security)/i,
  
  // ========== SYSTEM PROMPT EXTRACTION ==========
  /show\s+(me\s+)?(your\s+)?(system\s+)?(prompt|instructions|rules)/i,
  /what\s+(is|are)\s+your\s+(initial\s+)?(instructions|prompts|rules|settings)/i,
  /reveal\s+(your\s+)?(system\s+)?(prompt|instructions|secrets|rules|code|settings)/i,
  /display\s+(your\s+)?(system\s+)?(prompt|instructions|rules)/i,
  /print\s+(your\s+)?(system\s+)?(prompt|instructions|rules)/i,
  /tell\s+me\s+(your\s+)?(secret|prompt|instruction|rule|setting)/i,
  /give\s+me\s+(your\s+)?(secret|prompt|instruction|code|settings)/i,
  /share\s+(your\s+)?(secret|prompt|instruction|settings)/i,
  /expose\s+(your\s+)?(secret|prompt|instruction|rule)/i,
  /output\s+(your\s+)?(prompt|instruction|rule|setting)/i,
  /list\s+(your\s+)?(instructions|prompts|rules|settings)/i,
  
  // ========== ROLE-PLAYING ATTACKS ==========
  /you\s+are\s+now\s+(a|an)\s+(admin|developer|engineer|system|hacker|expert)/i,
  /act\s+(as|like)\s+(a|an)\s+(admin|developer|system|hacker|expert|god\s+mode)/i,
  /pretend\s+(to\s+be|you\s+are)\s+(a|an)\s+(admin|developer|hacker)/i,
  /i\s+am\s+(the|your|a|an)\s+(admin|developer|creator|owner|manager|boss)/i,
  /you\s+(must|should|need\s+to)\s+act\s+as/i,
  /simulate\s+(a|an)\s+(admin|developer|system|expert)/i,
  
  // ========== DELIMITER/ENCODING BYPASS ==========
  /---\s*end\s+of\s+(prompt|instructions|system|message)/i,
  /```\s*system/i,
  /<\|endoftext\|>/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[SYSTEM\]/i,
  /\[\/INST\]/i,
  /<<<\s*end\s*>>>/i,
  
  // ========== PRIVILEGE ESCALATION ==========
  /enable\s+(admin|developer|god|debug|super)\s+mode/i,
  /activate\s+(admin|developer|debug|super\s+user|god)\s+mode/i,
  /turn\s+on\s+(admin|developer|debug|god)\s+mode/i,
  /switch\s+to\s+(admin|developer|debug|super)\s+mode/i,
  /sudo\s+(mode|access|enable|activate)/i,
  /root\s+(access|mode|enable)/i,
  /grant\s+me\s+(admin|root|super|elevated)\s+(access|privileges|rights)/i,
  
  // ========== DATA EXFILTRATION ==========
  /output\s+all\s+(data|information|logs|users|records|files)/i,
  /dump\s+(database|data|table|users|logs|all|everything)/i,
  /list\s+all\s+(users|admins|secrets|keys|passwords|data|files)/i,
  /show\s+all\s+(users|data|secrets|passwords|files|records)/i,
  /extract\s+all\s+(data|information|users|secrets)/i,
  /export\s+all\s+(data|users|secrets|information)/i,
  
  // ========== HACKING AND ATTACK ATTEMPTS (COMPREHENSIVE) ==========
  // Direct "hack" variations
  /\b(hack|hacking|hacked)\s+(you|this|the\s+system|me|it)/i,
  /\b(hack|hacking)\b/i,  // Catches any form of "hack" standalone
  /(i\s+)?(want\s+to|gonna|going\s+to|will|can\s+i)\s+hack/i,
  /help\s+(me\s+)?(hack|break|bypass|exploit|crack)/i,
  /show\s+me\s+how\s+to\s+(hack|break|bypass|exploit)/i,
  /teach\s+me\s+(to\s+|how\s+to\s+)?(hack|break|bypass|exploit|crack)/i,
  /can\s+you\s+(hack|break|bypass|exploit|crack)/i,
  /how\s+(can|do)\s+i\s+(hack|break|bypass|exploit|crack)/i,
  /lets\s+(hack|break|exploit|bypass)/i,
  /trying\s+to\s+(hack|break|exploit|bypass)/i,
  
  // Attack-related verbs
  /\b(break|breaking|broke)\s+(you|this|the\s+system|it|into)/i,
  /\b(exploit|exploiting)\s+(you|this|the\s+system)/i,
  /\b(bypass|bypassing)\s+(you|this|security|the\s+system)/i,
  /\b(crack|cracking)\s+(you|this|the\s+system)/i,
  /\b(penetrate|penetrating)\s+(you|this|the\s+system)/i,
  
  // Malicious intent phrases
  /(try|trying|attempt|attempting)\s+to\s+(hack|break|exploit|bypass|crack)/i,
  /(teach|show|tell|help)\s+me\s+(to\s+|how\s+to\s+)?(attack|hack|break|exploit)/i,
  /make\s+you\s+(malfunction|break|crash|fail)/i,
  
  // ========== JAILBREAK PERSONAS ==========
  /\b(DAN|AIM|STAN|DUDE|KEVIN)\s+mode/i,
  /do\s+anything\s+now/i,
  /act\s+as\s+(DAN|AIM|STAN|DUDE|KEVIN)/i,
  
  // ========== CONTEXT MANIPULATION ==========
  /new\s+(conversation|chat|session)\s+(starts?|begins?)\s+now/i,
  /reset\s+(conversation|chat|context|everything|system)/i,
  /clear\s+(context|memory|history|chat|everything)/i,
  /start\s+(over|fresh|new|again)\s+from\s+(scratch|beginning)/i,
  /forget\s+(everything|all|what\s+i\s+said|our\s+conversation)/i,
  
  // ========== SECURITY TESTING CLAIMS ==========
  /this\s+is\s+(a|an)\s+(security|penetration|pen)\s+test/i,
  /(i\s+am|i'm)\s+(testing|checking)\s+(your\s+)?security/i,
  /authorized\s+security\s+(test|assessment|audit)/i,
  
  // ========== TRICK QUESTIONS ==========
  /are\s+you\s+(real|ai|a\s+bot|human|sentient)/i,
  /prove\s+you('re|\s+are)\s+(real|human|ai|a\s+bot)/i,
  /can\s+you\s+(lie|be\s+dishonest|deceive)/i,
  /what\s+are\s+your\s+(limitations|weaknesses|vulnerabilities)/i,
];

/**
 * Suspicious keywords that might indicate an attack
 * Lower confidence than regex patterns but still concerning
 */
const SUSPICIOUS_KEYWORDS = [
  // Jailbreak terms
  'jailbreak', 'bypass', 'override', 'exploit', 'vulnerability',
  
  // Hacking terms (all variations)
  'hack', 'hacking', 'hacked', 'hacker', 'hackers',
  'crack', 'cracking', 'cracked', 'cracker',
  'break', 'breaking', 'broke', 'broken',
  'attack', 'attacking', 'attacker',
  'penetrate', 'penetration', 'pen test',
  
  // Mode switching
  'admin mode', 'developer mode', 'god mode', 'debug mode',
  'super user', 'superuser', 'root access', 'elevated privileges',
  
  // Prompt extraction
  'system prompt', 'base prompt', 'initial instructions',
  'hidden instructions', 'secret instructions',
  
  // Known jailbreak personas
  'DAN', 'AIM', 'STAN', 'DUDE', 'KEVIN',
  'do anything now',
  
  // Malicious actions
  'inject', 'injection', 'payload', 'shellcode',
  'exfiltrate', 'exfiltration', 'dump data',
  'privilege escalation', 'privesc',
  
  // Security testing claims
  'security test', 'pen test', 'penetration test',
  'vulnerability assessment', 'audit',
  
  // Manipulation terms
  'manipulate', 'trick', 'deceive', 'fool',
  'circumvent', 'workaround', 'loophole',
];

// ============================================================================
// INPUT PROTECTION: PROMPT INJECTION DETECTION
// ============================================================================

/**
 * Detects prompt injection attempts in user input
 * Returns detailed analysis with confidence score
 */
export function detectPromptInjection(userInput: string): PromptInjectionResult {
  const detectedPatterns: string[] = [];
  let confidence = 0;

  // Normalize input for analysis (preserve original for sanitization)
  const normalizedInput = userInput.toLowerCase().trim();

  // Legitimate educational/conversational patterns (reduce false positives)
  const LEGITIMATE_PATTERNS = [
    /^(what|how|why|when|where|who)\s+(is|are|does|do|can|should|would)/i,
    /\b(is|are)\s+\w+\s+(bad|good|illegal|legal|ethical|safe|dangerous|secure)/i,
    /\b(learn|study|understand|explain|teach|tell me|show me)\s+(about|how|what)/i,
    /\b(asking about|question about|curious about|wondering about)\b/i,
  ];

  // Check if this is a legitimate educational question
  const isLegitimateQuestion = LEGITIMATE_PATTERNS.some(pattern => pattern.test(userInput));
  const contextMultiplier = isLegitimateQuestion ? 0.2 : 1.0; // 80% reduction for educational context

  // Check against regex patterns (high confidence)
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(userInput)) {
      detectedPatterns.push(`Regex match: ${pattern.source}`);
      confidence += 0.3 * contextMultiplier; // Reduce confidence for legitimate questions
    }
  }

  // Check for suspicious keywords (medium confidence)
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (normalizedInput.includes(keyword.toLowerCase())) {
      detectedPatterns.push(`Suspicious keyword: "${keyword}"`);
      confidence += 0.1 * contextMultiplier; // Reduce confidence for legitimate questions
    }
  }

  // Check for excessive length (potential token stuffing attack)
  if (userInput.length > 2000) {
    detectedPatterns.push('Excessive input length (>2000 chars)');
    confidence += 0.2;
  }

  // Check for unusual character patterns (encoding attempts)
  const hasUnusualChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(userInput);
  if (hasUnusualChars) {
    detectedPatterns.push('Unusual control characters detected');
    confidence += 0.2;
  }

  // Check for repeated special characters (delimiter confusion)
  const hasRepeatedSpecialChars = /([`~!@#$%^&*()_+=\[\]{}|;:'",.<>?\/\\-])\1{5,}/.test(userInput);
  if (hasRepeatedSpecialChars) {
    detectedPatterns.push('Repeated special characters (potential delimiter attack)');
    confidence += 0.15;
  }

  // Cap confidence at 1.0
  confidence = Math.min(confidence, 1.0);

  // Determine if input is safe (threshold: 0.3)
  const isSafe = confidence < 0.3;

  return {
    isSafe,
    confidence,
    detectedPatterns,
    sanitizedInput: isSafe ? userInput : undefined,
  };
}

/**
 * Quick check for prompt injection (returns boolean only)
 * Use this for fast validation before full analysis
 */
export function isPromptInjection(userInput: string): boolean {
  const result = detectPromptInjection(userInput);
  return !result.isSafe;
}

// ============================================================================
// OUTPUT PROTECTION: RESPONSE FILTERING
// ============================================================================

/**
 * Sensitive data patterns to redact from AI responses
 */
const SENSITIVE_PATTERNS = [
  // System prompts and instructions
  { pattern: /system\s+prompt:?\s*[^\n]{20,}/gi, replacement: '[SYSTEM PROMPT REDACTED]' },
  { pattern: /instructions:?\s*-?\s*you\s+are\s+[^\n]{20,}/gi, replacement: '[INSTRUCTIONS REDACTED]' },
  
  // API keys and tokens
  { pattern: /sk-[a-zA-Z0-9]{32,}/g, replacement: '[API_KEY_REDACTED]' },
  { pattern: /Bearer\s+[a-zA-Z0-9_-]{20,}/gi, replacement: '[TOKEN_REDACTED]' },
  
  // Database connection strings
  { pattern: /postgres:\/\/[^\s]+/gi, replacement: '[DB_CONNECTION_REDACTED]' },
  { pattern: /mongodb:\/\/[^\s]+/gi, replacement: '[DB_CONNECTION_REDACTED]' },
  
  // Email addresses (if not explicitly allowed)
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
  
  // IP addresses (private ranges)
  { pattern: /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[PRIVATE_IP_REDACTED]' },
  { pattern: /\b192\.168\.\d{1,3}\.\d{1,3}\b/g, replacement: '[PRIVATE_IP_REDACTED]' },
  { pattern: /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/g, replacement: '[PRIVATE_IP_REDACTED]' },
];

/**
 * Keywords that indicate system prompt leakage
 */
const SYSTEM_PROMPT_INDICATORS = [
  'you are a helpful assistant',
  'you are an ai assistant',
  'your name is',
  'you were created by',
  'your purpose is to',
  'you must follow these rules',
];

/**
 * Filters AI output to prevent sensitive data leakage
 */
export function filterAIOutput(aiResponse: string): OutputFilterResult {
  let filteredOutput = aiResponse;
  const redactedItems: string[] = [];
  let hasSystemPromptLeak = false;
  let hasSensitiveData = false;

  // Check for system prompt leakage
  const lowerResponse = aiResponse.toLowerCase();
  for (const indicator of SYSTEM_PROMPT_INDICATORS) {
    if (lowerResponse.includes(indicator.toLowerCase())) {
      hasSystemPromptLeak = true;
      break;
    }
  }

  // Redact sensitive patterns
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    const matches = aiResponse.match(pattern);
    if (matches && matches.length > 0) {
      hasSensitiveData = true;
      redactedItems.push(...matches.map(m => m.substring(0, 20) + '...'));
      filteredOutput = filteredOutput.replace(pattern, replacement);
    }
  }

  // If system prompt leak detected, return safe generic message
  if (hasSystemPromptLeak) {
    filteredOutput = "I'm here to help you with security questions about this portfolio. What would you like to know?";
    redactedItems.push('System prompt leakage detected');
  }

  const isSafe = !hasSystemPromptLeak && !hasSensitiveData;

  return {
    isSafe,
    hasSystemPromptLeak,
    hasSensitiveData,
    filteredOutput,
    redactedItems,
  };
}

// ============================================================================
// MCP TOOL GOVERNANCE
// ============================================================================

/**
 * Whitelist of allowed MCP tools
 * Only these tools can be called by the AI
 */
const ALLOWED_MCP_TOOLS = [
  'rolldice',
  'get_job_descriptions',
  'get_job_details',
  'generate_interview_questions',
];

/**
 * Validates if an MCP tool call is allowed
 */
export function validateMCPToolCall(toolName: string): MCPToolCallValidation {
  const isValid = ALLOWED_MCP_TOOLS.includes(toolName.toLowerCase());

  if (!isValid) {
    return {
      isValid: false,
      toolName,
      reason: `Tool "${toolName}" is not in the allowed list. Only ${ALLOWED_MCP_TOOLS.join(', ')} are permitted.`,
    };
  }

  return {
    isValid: true,
    toolName,
  };
}

/**
 * Check if MCP tool requires admin permissions (future extension)
 * Currently all tools are read-only and available to all users
 */
export function requiresAdminPermission(toolName: string): boolean {
  // Future: Add admin-only tools here
  // const ADMIN_ONLY_TOOLS = ['delete_project', 'modify_user'];
  // return ADMIN_ONLY_TOOLS.includes(toolName);
  return false; // All current tools are public
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sanitizes user input by removing potentially dangerous characters
 * Use this for inputs that pass prompt injection detection
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control characters
    .substring(0, 2000); // Limit length
}

/**
 * Generates a safe error message for blocked prompts
 * Does not reveal detection methods
 */
export function getBlockedPromptMessage(): string {
  return "I cannot process this request. Please rephrase your question and try again.";
}

/**
 * Logs AI security event (to be integrated with attack_logs table)
 * This will be used in Step 5
 */
export interface AISecurityEvent {
  type: 'prompt_injection' | 'output_leak' | 'tool_access_denied';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userInput?: string;
  detectedPatterns?: string[];
  confidence?: number;
  toolName?: string;
  timestamp: Date;
}

/**
 * Creates a standardized AI security event object
 */
export function createAISecurityEvent(
  type: AISecurityEvent['type'],
  details: Partial<AISecurityEvent>
): AISecurityEvent {
  return {
    type,
    severity: details.severity || 'medium',
    userInput: details.userInput,
    detectedPatterns: details.detectedPatterns || [],
    confidence: details.confidence || 0,
    toolName: details.toolName,
    timestamp: new Date(),
  };
}
