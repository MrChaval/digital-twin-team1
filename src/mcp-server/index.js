#!/usr/bin/env node

/**
 * Digital Twin MCP Server
 * Provides tools for interview simulation and portfolio data access
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to jobs folder (two levels up from src/mcp-server/)
const JOBS_DIR = path.join(__dirname, '../../jobs');

/**
 * MCP Server Instance
 */
const server = new Server(
  {
    name: 'digital-twin-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool 1: ROLLDICE (Example pattern required by Week 3)
 * Rolls a dice with specified number of sides
 */
async function rollDice(sides = 6) {
  if (sides < 2) {
    throw new Error('Dice must have at least 2 sides');
  }
  if (sides > 100) {
    throw new Error('Dice cannot have more than 100 sides');
  }
  
  const result = Math.floor(Math.random() * sides) + 1;
  return {
    sides,
    result,
    message: `🎲 Rolled a ${sides}-sided dice: ${result}`,
  };
}

/**
 * Tool 2: GET JOB DESCRIPTIONS
 * Returns all available job descriptions for interview simulation
 */
async function getJobDescriptions() {
  try {
    const files = await fs.readdir(JOBS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const jobs = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(JOBS_DIR, file), 'utf-8');
        return JSON.parse(content);
      })
    );
    
    return {
      count: jobs.length,
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        level: job.level,
        location: job.location,
      })),
    };
  } catch (error) {
    throw new Error(`Failed to read job descriptions: ${error.message}`);
  }
}

/**
 * Tool 3: GET JOB DETAILS
 * Returns full details of a specific job by ID
 */
async function getJobDetails(jobId) {
  try {
    const files = await fs.readdir(JOBS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(JOBS_DIR, file), 'utf-8');
      const job = JSON.parse(content);
      
      if (job.id === jobId) {
        return job;
      }
    }
    
    throw new Error(`Job with ID "${jobId}" not found`);
  } catch (error) {
    throw new Error(`Failed to get job details: ${error.message}`);
  }
}

/**
 * Tool 4: GENERATE INTERVIEW QUESTIONS
 * Generates interview questions based on job requirements
 */
async function generateInterviewQuestions(jobId) {
  try {
    const job = await getJobDetails(jobId);
    
    // Extract skills and requirements for questions
    const questions = [];
    
    // Technical skills questions (from skills array)
    if (job.skills && job.skills.length > 0) {
      const selectedSkills = job.skills.slice(0, 3);
      selectedSkills.forEach(skill => {
        questions.push({
          category: 'Technical',
          question: `Can you describe your experience with ${skill}?`,
          skill,
        });
      });
    }
    
    // Responsibility-based questions
    if (job.responsibilities && job.responsibilities.length > 0) {
      const selectedResp = job.responsibilities.slice(0, 2);
      selectedResp.forEach(resp => {
        questions.push({
          category: 'Behavioral',
          question: `Tell me about a time when you had to: ${resp.toLowerCase()}`,
          responsibility: resp,
        });
      });
    }
    
    // Requirement-based questions
    if (job.requirements && job.requirements.length > 0) {
      const selectedReq = job.requirements.slice(0, 2);
      selectedReq.forEach(req => {
        questions.push({
          category: 'Experience',
          question: `This role requires: ${req}. How do you meet this requirement?`,
          requirement: req,
        });
      });
    }
    
    return {
      jobTitle: job.title,
      company: job.company,
      totalQuestions: questions.length,
      questions,
    };
  } catch (error) {
    throw new Error(`Failed to generate interview questions: ${error.message}`);
  }
}

/**
 * Register available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'rolldice',
        description: 'Roll a dice with a specified number of sides (2-100). Example MCP tool pattern.',
        inputSchema: {
          type: 'object',
          properties: {
            sides: {
              type: 'number',
              description: 'Number of sides on the dice (default: 6)',
              minimum: 2,
              maximum: 100,
            },
          },
        },
      },
      {
        name: 'get_job_descriptions',
        description: 'Get a list of all available job descriptions for interview simulation. Returns job ID, title, company, level, and location.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_job_details',
        description: 'Get full details of a specific job including responsibilities, requirements, skills, and salary.',
        inputSchema: {
          type: 'object',
          properties: {
            jobId: {
              type: 'string',
              description: 'The unique ID of the job (e.g., "job-001")',
            },
          },
          required: ['jobId'],
        },
      },
      {
        name: 'generate_interview_questions',
        description: 'Generate interview questions based on a specific job\'s requirements and skills.',
        inputSchema: {
          type: 'object',
          properties: {
            jobId: {
              type: 'string',
              description: 'The unique ID of the job to generate questions for',
            },
          },
          required: ['jobId'],
        },
      },
    ],
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'rolldice': {
        const sides = args?.sides ?? 6;
        const result = await rollDice(sides);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_job_descriptions': {
        const result = await getJobDescriptions();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_job_details': {
        if (!args?.jobId) {
          throw new Error('jobId argument is required');
        }
        const result = await getJobDetails(args.jobId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'generate_interview_questions': {
        if (!args?.jobId) {
          throw new Error('jobId argument is required');
        }
        const result = await generateInterviewQuestions(args.jobId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Digital Twin MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
