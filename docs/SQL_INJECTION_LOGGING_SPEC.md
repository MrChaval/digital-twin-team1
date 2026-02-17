# SQL Injection Security Logging Specification
## Comprehensive Security Data Collection Strategy

---

## 📋 Executive Summary

This document defines all security data that **MUST** be collected for SQL injection attempts across the Digital Twin III portfolio. It ensures complete attack visibility, forensic capability, and compliance with security best practices.

---

## 🎯 Logging Objectives

### Primary Goals:
1. **Detection** - Identify all SQL injection attempts in real-time
2. **Attribution** - Track attacker identity, location, and behavior
3. **Analysis** - Enable pattern recognition and threat intelligence
4. **Evidence** - Maintain forensic trail for incident response
5. **Compliance** - Meet audit and regulatory requirements

### Success Criteria:
- ✅ 100% of SQL injection attempts logged
- ✅ No false negatives (all attacks captured)
- ✅ Minimal performance impact (<50ms per request)
- ✅ Structured, queryable log format
- ✅ Retention policy and privacy compliance

---

## 🔍 Data Points to Capture

### 1. **Attack Metadata** (REQUIRED)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | Integer | Auto-increment primary key | `123` |
| `timestamp` | Timestamp | Exact time of attack (UTC) | `2026-02-17 10:30:45` |
| `severity` | Integer (1-10) | Attack severity score | `9` |
| `type` | String | Attack classification | `SQL_INJECTION|source:newsletter_email|confidence:85%|patterns:3` |

**Type Field Format:**
```
SQL_INJECTION|source:{input_source}|confidence:{percentage}|patterns:{count}
```

### 2. **Attacker Information** (REQUIRED)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `ip` | String | Client IP address (real, not proxy) | `192.168.1.100` |
| `city` | String (nullable) | City from geo-location | `Bangkok` |
| `country` | String (nullable) | Country name | `Thailand` |
| `latitude` | String (nullable) | Geographic coordinate | `13.7563` |
| `longitude` | String (nullable) | Geographic coordinate | `100.5018` |

**IP Extraction Priority:**
1. `x-forwarded-for` header (first IP)
2. `x-real-ip` header
3. `cf-connecting-ip` header (Cloudflare)
4. Connection remote address

### 3. **Input Context** (Logged separately for analysis)

| Field | Description | Logged In |
|-------|-------------|-----------|
| `inputValue` | The actual malicious input | Console only (not DB for privacy) |
| `inputSource` | Which field was attacked | Type string |
| `inputLength` | Character count | Derived |
| `encodingType` | URL/Base64/Hex encoding detected | Pattern analysis |

**Input Sources Tracked:**
- `newsletter_email` - Newsletter subscription email field
- `newsletter_name` - Newsletter subscription name field
- `chatbot_message` - AI chatbot user message
- `project_title` - Admin project creation title
- `project_description` - Admin project description
- `project_icon` - Admin project icon name
- `project_items` - Admin project items array
- `contact_name` - Contact form name
- `contact_email` - Contact form email
- `contact_message` - Contact form message
- `search_query` - Search functionality
- `url_parameter` - URL query parameters
- `unknown` - Unclassified source

### 4. **Pattern Detection Data** (REQUIRED)

| Field | Description | Example |
|-------|-------------|---------|
| `detectedPatterns` | SQL patterns matched | `["Pattern_1: OR 1=1", "Pattern_3: --"]` |
| `confidence` | Detection confidence (0-1) | `0.85` |
| `patternCount` | Number of patterns matched | `3` |

**Pattern Categories Detected:**
1. Classic SQL injection (`' OR 1=1--`)
2. Comment injection (`--`, `/**/`, `#`)
3. Union-based (`UNION SELECT`)
4. Stacked queries (`;INSERT`, `;DROP`)
5. SQL keywords (`DROP TABLE`, `DELETE FROM`)
6. Time-based blind (`SLEEP()`, `WAITFOR`)
7. Error-based (`extractvalue()`, `updatexml()`)
8. Information schema access
9. Database version detection (`@@version`)
10. Quote escaping (`\'`, `\"`, `%27`)
11. Hex encoding (`0x414243`)
12. String concatenation (`CONCAT()`, `||`)

### 5. **Request Metadata** (LOGGED)

| Field | Source | Description |
|-------|--------|-------------|
| `userAgent` | HTTP header | Browser/tool identification |
| `referer` | HTTP header | Source page URL |
| `requestMethod` | HTTP header | GET/POST/PUT/DELETE |
| `contentType` | HTTP header | Request content type |
| `origin` | HTTP header | Request origin domain |

### 6. **Session & User Context** (If authenticated)

| Field | Description | Privacy Note |
|-------|-------------|--------------|
| `userId` | Clerk user ID | Only if authenticated |
| `userEmail` | User email | Hashed for privacy |
| `userRole` | admin/user | Authorization level |
| `sessionId` | Session identifier | For correlation |

### 7. **Response & Mitigation** (LOGGED)

| Field | Description |
|-------|-------------|
| `blocked` | Was request blocked? (boolean) |
| `blockLayer` | Which layer blocked? (Arcjet/Drizzle/Zod/Custom) |
| `responseStatus` | HTTP status code (403/400/422) |
| `mitigationAction` | Action taken (BLOCK/LOG/ALERT) |

---

## 📊 Logging Flow Architecture

```
╔════════════════════════════════════════════════════════════╗
║  USER INPUT → SQL INJECTION DETECTION → LOGGING PIPELINE  ║
╚════════════════════════════════════════════════════════════╝

┌─────────────────┐
│  User Input     │
│  (Any form/API) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 1: SQL  Injection Detection                  │
│  lib/security/sql-injection-logger.ts               │
│  - Pattern matching (16+ patterns)                  │
│  - Confidence scoring                               │
│  - Source identification                            │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 2: Metadata Collection                       │
│  - Extract IP from headers (x-forwarded-for, etc)   │
│  - Get user agent, referer, method          │
│  - Identify input source                            │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 3: Geo-Location Resolution                   │
│  - Query ipapi.co (primary)                         │
│  - Fallback to ip-api.com                           │
│  - Extract city, country, lat/lon                   │
│  - Timeout: 3 seconds                               │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 4: Database Logging                          │
│  - Insert into attack_logs table                    │
│  - Atomic transaction                               │
│  - Non-blocking (fire and forget)                   │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  LAYER 5: Console Logging (Development)             │
│  - Detailed attack information                      │
│  - Full pattern list                                │
│  - Input preview (first 100 chars)                  │
└─────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### `attack_logs` Table Structure:

```sql
CREATE TABLE attack_logs (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  severity INTEGER NOT NULL,  -- 1-10 scale
  type TEXT NOT NULL,          -- "SQL_INJECTION|source:X|confidence:Y%|patterns:Z"
  timestamp TIMESTAMP DEFAULT NOW(),
  city TEXT,
  country TEXT,
  latitude TEXT,
  longitude TEXT
);

-- Indexes for performance
CREATE INDEX idx_attack_logs_type ON attack_logs(type);
CREATE INDEX idx_attack_logs_timestamp ON attack_logs(timestamp DESC);
CREATE INDEX idx_attack_logs_ip ON attack_logs(ip);
CREATE INDEX idx_attack_logs_severity ON attack_logs(severity DESC);
CREATE INDEX idx_attack_logs_country ON attack_logs(country);
```

### Query Examples:

```sql
-- Get all SQL injection attempts in last 24 hours
SELECT * FROM attack_logs
WHERE type LIKE 'SQL_INJECTION%'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Count by input source
SELECT 
  SUBSTRING(type FROM 'source:(\w+)') as source,
  COUNT(*) as count
FROM attack_logs
WHERE type LIKE 'SQL_INJECTION%'
GROUP BY source
ORDER BY count DESC;

-- Get high-severity attacks by country
SELECT country, COUNT(*) as count
FROM attack_logs
WHERE type LIKE 'SQL_INJECTION%'
  AND severity >= 7
  AND country IS NOT NULL
GROUP BY country
ORDER BY count DESC
LIMIT 10;

-- Get attack confidence distribution
SELECT 
  SUBSTRING(type FROM 'confidence:(\d+)%') as confidence,
  COUNT(*) as count
FROM attack_logs
WHERE type LIKE 'SQL_INJECTION%'
GROUP BY confidence
ORDER BY confidence DESC;
```

---

## 📝 Console Logging Format

### Standard Log Entry:

```javascript
console.log('🚨 [SQL INJECTION] Attack attempt detected and logged:', {
  timestamp: '2026-02-17T10:30:45.123Z',
  ip: '192.168.1.100',
  inputSource: 'newsletter_email',
  severity: 9,
  confidence: '85%',
  patternsDetected: 3,
  patterns: [
    "Pattern_1: (\\bOR\\b|\\bAND\\b)\\s+['\"]]?\\d+['\"]]?\\s*=\\s*['\"]]?\\d+",
    "Pattern_2: --\\s*$",
    "Pattern_5: \\b(DROP|DELETE|TRUNCATE|ALTER|CREATE)\\s+(TABLE|DATABASE|SCHEMA)\\b"
  ],
  inputPreview: "admin' OR '1'='1'--",
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
  referer: 'https://digital-twin.vercel.app/',
  location: 'Bangkok, Thailand',
  action: 'newsletter_subscription'
});
```

---

## 🔐 Privacy & Compliance

### Data Retention:
- **Attack logs:** 90 days
- **High-severity attacks (≥7):** 1 year
- **Critical attacks (≥9):** 2 years

### PII Handling:
- ❌ **DO NOT** store full malicious input in database  
- ✅ **DO** log input preview in console (development only)
- ✅ **DO** hash user emails if logging authenticated requests
- ✅ **DO** anonymize IP addresses after 30 days (GDPR option)

### GDPR Compliance:
- Right to erasure: Delete user-specific attack logs on request
- Data minimization: Store only necessary fields
- Encryption: Use TLS for geo-location API calls
- Access control: Restrict attack log queries to admins only

---

## 📊 Monitoring & Alerting

### Real-time Alerts:

**High-Priority Alerts (Send immediately):**
- 5+ SQL injection attempts from same IP in 1 minute
- Critical severity attack (≥9)
- SQL injection attempt from admin user account

**Medium-Priority Alerts (Send hourly digest):**
- 10+ SQL injection attempts in 1 hour
- New attack pattern detected (not in known patterns)
- Attacks from blocked/blacklisted IP

**Low-Priority Alerts (Send daily digest):**
- Daily attack summary
- New geographic regions detected
- Unusual time-of-day patterns

### Dashboard Metrics:

1. **Total SQL injection attempts** (all-time, 24h, 7d, 30d)
2. **Attempts by input source** (chart)
3. **Severity distribution** (pie chart)
4. **attacks by country** (world map)
5. **Hourly distribution** (heat map)
6. **Top 10 attacker IPs**
7. **Average confidence score trend**
8. **Protection effectiveness** (% blocked)

---

## 🧪 Testing & Validation

### Required Tests:

1. **Logging Completeness Test**
   - Submit SQL injection payloads to each input
   - Verify attack logged in database
   - Confirm all required fields populated

2. **Performance Test**
   - Measure logging overhead (<50ms)
   - Test under load (100 req/sec)
   - Verify no request blocking

3. **Geo-Location Test**
   - Test with various IP addresses
   - Verify city/country accuracy
   - Test timeout handling (3sec)

4. **Privacy Test**
   - Verify no full input stored in DB
   - Confirm PII hashing
   - Test log retention policy

### Test Script:

```bash
# Run comprehensive SQL injection test
node scripts/test-sql-injection.js

# Generate security report
node scripts/generate-sql-injection-report.js

# Check database logs
psql $DATABASE_URL -c "SELECT * FROM attack_logs WHERE type LIKE 'SQL_INJECTION%' ORDER BY timestamp DESC LIMIT 10;"
```

---

## 🚀 Implementation Checklist

### Integrated into:
- ✅ **Newsletter subscription** (`app/actions/newsletter.ts`)
- ✅ **Project creation** (`app/actions/projects.ts`)
- ✅ **Chatbot messages** (`app/actions/chat.ts`)
- ⬜ **Contact form** (TODO)
- ⬜ **Search functionality** (TODO)
- ⬜ **URL parameters** (TODO)

### Required Components:
- ✅ SQL injection detection library (`lib/security/sql-injection-logger.ts`)
- ✅ 16+ pattern definitions
- ✅ Confidence scoring algorithm
- ✅ Geo-location resolution with fallback
- ✅ Database logging (attack_logs table)
- ✅ Console logging (development)
- ✅ Automated testing script
- ✅ Security report generator

---

## 📚 Related Documentation

- **Security Guide:** `docs/SQL_INJECTION_SECURITY_GUIDE.md`
- **Implementation:** `lib/security/sql-injection-logger.ts`
- **Testing:** `scripts/test-sql-injection.js`
- **Reporting:** `scripts/generate-sql-injection-report.js`

---

**Document Version:** 1.0  
**Last Updated:** February 17, 2026  
**Author:** JaiZz with GitHub Copilot  
**Classification:** Internal Security Documentation
