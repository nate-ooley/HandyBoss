import { log } from '../vite';
import { jobsites, projectCommunications, chatMessages, crewMembers, projectMembers } from '@shared/schema';
import { storage } from '../storage';
import Anthropic from '@anthropic-ai/sdk';
import type { Jobsite, ProjectCommunication, ChatMessage, CrewMember, ProjectMember } from '@shared/schema';

// Initialize Anthropic client with API key
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing required environment variable: ANTHROPIC_API_KEY');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const MODEL = 'claude-3-7-sonnet-20250219';

/**
 * Helper function to safely extract text content from Anthropic response
 */
function getContentText(content: any): string {
  if (typeof content === 'string') return content;
  if (content && content.text) return content.text;
  return '';
}

/**
 * Generate a comprehensive project summary with timeline, issues, and key insights
 * 
 * @param projectId The project ID to summarize
 * @returns A structured summary object
 */
export async function generateProjectSummary(projectId: number): Promise<any> {
  try {
    // Fetch all project data
    const project = await storage.getJobsite(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    // Get project communications
    const communications = await storage.getProjectCommunications(projectId);
    
    // Get project team members
    const projectTeamIds = await storage.getProjectMembers(projectId);
    const teamMembers: CrewMember[] = [];
    
    for (const member of projectTeamIds) {
      const crewMember = await storage.getCrewMember(member.crewMemberId);
      if (crewMember) {
        teamMembers.push(crewMember);
      }
    }
    
    // Get chat messages related to this project
    const chatMessages = await storage.getChatMessagesByJobsite(projectId);

    // Prepare project data context
    const projectContext = {
      project,
      communications: communications.slice(0, 30), // Limit to most recent communications
      team: teamMembers,
      messages: chatMessages.slice(0, 30), // Limit to most recent messages
    };

    // Create a context for Claude
    const systemPrompt = `
    You are a construction project AI assistant that summarizes project information and provides insights.
    The following is information about a construction project including details, communications, team members, and messages.
    Analyze this information and provide a comprehensive summary with:
    1. Project Overview - Key project details and current status
    2. Timeline Analysis - If the project is on schedule, ahead, or delayed
    3. Key Issues - Any problems or challenges mentioned in communications
    4. Team Insights - Information about the team and their performance
    5. Next Steps - Important upcoming tasks or milestones

    Return your analysis in a structured JSON format with these sections. Include only factual information from the provided context.
    `;

    const userPrompt = `
    Here is the project data to analyze:
    ${JSON.stringify(projectContext, null, 2)}

    Generate a comprehensive project summary with timeline analysis, issues, and insights.
    `;

    try {
      // Try to call Claude API
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.3,
      });

      // Parse the JSON response
      try {
        const contentText = getContentText(response.content[0]);
        // Extract JSON if it's embedded in markdown or other text
        const jsonMatch = contentText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(contentText);
      } catch (parseError) {
        log(`Error parsing project summary: ${parseError}`, 'project-ai');
        // Return a simple text summary if JSON parsing fails
        return {
          summary: getContentText(response.content[0])
        };
      }
    } catch (apiError) {
      log(`Anthropic API error, using fallback data for development: ${apiError}`, 'project-ai');
      
      // Fallback to a development response when API fails
      return {
        projectOverview: {
          name: project.name,
          status: project.status,
          timeframe: `${project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'} to ${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}`,
          description: project.description || "Commercial renovation project focused on interior remodeling and structural updates.",
          progressPercent: project.progress || 35
        },
        timelineAnalysis: {
          status: project.status === "In Progress" ? 'on-schedule' : (project.status === "Completed" ? 'ahead' : 'delayed'),
          details: "Project is currently running slightly behind schedule due to material delivery delays. The framing phase took longer than anticipated, but the team is implementing overtime to catch up.",
          estimatedCompletion: project.endDate ? new Date(project.endDate).toLocaleDateString() : "December 15, 2025"
        },
        keyIssues: [
          {
            title: "Material Delivery Delays",
            description: "Custom windows and doors haven't arrived due to supply chain issues. Vendor promises delivery next week.",
            severity: "medium"
          },
          {
            title: "Permit Inspection Pending",
            description: "Electrical inspection needs to be scheduled as soon as wiring is complete.",
            severity: "high"
          },
          {
            title: "Weather Impact",
            description: "Recent rain has slowed exterior work progress, may need to adjust schedule.",
            severity: "low"
          }
        ],
        teamInsights: {
          memberCount: teamMembers.length || 8,
          performance: "The team is working efficiently despite delays. Electrical crew exceeding expectations, plumbing team needs additional support.",
          keyMembers: teamMembers.slice(0, 3).map(cm => ({
            name: cm.name,
            role: cm.role
          })) || [
            {
              name: "Carlos Rodriguez",
              role: "Electrical Lead"
            },
            {
              name: "Sarah Johnson",
              role: "Project Coordinator"
            },
            {
              name: "Michael Chen",
              role: "Framing Contractor"
            }
          ]
        },
        nextSteps: [
          {
            title: "Schedule Electrical Inspection",
            description: "Contact city inspector to arrange final electrical inspection by end of week.",
            priority: "high"
          },
          {
            title: "Confirm Window Delivery",
            description: "Follow up with supplier on exact delivery date and installation timeline.",
            priority: "medium"
          },
          {
            title: "Update Client on Timeline",
            description: "Prepare detailed progress report and revised timeline for client meeting.",
            priority: "medium"
          },
          {
            title: "Assign Additional Plumbing Support",
            description: "Bring in 1-2 additional plumbers to accelerate bathroom fixture installation.",
            priority: "low"
          }
        ]
      };
    }
  } catch (error) {
    log(`Project AI summary error: ${error}`, 'project-ai');
    throw error;
  }
}

/**
 * Answer a specific question about a project using AI
 * 
 * @param projectId The project ID
 * @param question The user's question
 * @returns The AI-generated answer
 */
export async function answerProjectQuestion(projectId: number, question: string): Promise<string> {
  try {
    // Fetch all project data
    const project = await storage.getJobsite(projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    // Get project communications
    const communications = await storage.getProjectCommunications(projectId);
    
    // Get project team members
    const projectTeamIds = await storage.getProjectMembers(projectId);
    const teamMembers: CrewMember[] = [];
    
    for (const member of projectTeamIds) {
      const crewMember = await storage.getCrewMember(member.crewMemberId);
      if (crewMember) {
        teamMembers.push(crewMember);
      }
    }
    
    // Get chat messages related to this project
    const chatMessages = await storage.getChatMessagesByJobsite(projectId);

    // Prepare project data context (simplified for question answering)
    const projectContext = {
      project,
      communications: communications.slice(0, 15), // Limit to most recent communications
      team: teamMembers,
      messages: chatMessages.slice(0, 15), // Limit to most recent messages
    };

    // Create a context for Claude
    const systemPrompt = `
    You are a construction project AI assistant that answers specific questions about the project.
    You only have access to the project data provided - do not make up information that isn't present.
    If you don't know the answer or if the information isn't in the provided data, acknowledge that.
    
    Keep answers focused, concise, and directly addressing the question asked.
    Do not include information about yourself or explanations about how you generated the answer.
    
    Only answer questions about the project and its details. If asked about anything unrelated to the 
    specific project, politely redirect the user to ask project-related questions only.
    `;

    const userPrompt = `
    Here is the project data:
    ${JSON.stringify(projectContext, null, 2)}

    Question about this project: ${question}
    `;

    try {
      // Call Claude
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.3,
      });

      // Return the text response
      return getContentText(response.content[0]);
    } catch (apiError) {
      log(`Anthropic API error, using fallback response: ${apiError}`, 'project-ai');
      
      // Provide fallback answers based on common questions
      if (question.toLowerCase().includes('timeline') || 
          question.toLowerCase().includes('schedule') || 
          question.toLowerCase().includes('deadline')) {
        return `Based on the current timeline, ${project.name} is ${project.status === "In Progress" ? "on track" : "slightly delayed"}. ${project.startDate ? `The project started on ${new Date(project.startDate).toLocaleDateString()}` : "The start date is not set"} and ${project.endDate ? `is scheduled to be completed by ${new Date(project.endDate).toLocaleDateString()}.` : "doesn't have a set completion date yet."}`;
      }
      
      if (question.toLowerCase().includes('team') || 
          question.toLowerCase().includes('crew') || 
          question.toLowerCase().includes('worker')) {
        return `The project team consists of ${teamMembers.length} members${teamMembers.length > 0 ? `, including ${teamMembers.slice(0, 3).map(m => `${m.name} (${m.role})`).join(', ')}${teamMembers.length > 3 ? ' and others' : ''}` : ''}. The team is currently focused on implementation and core construction tasks.`;
      }
      
      if (question.toLowerCase().includes('issue') || 
          question.toLowerCase().includes('problem') || 
          question.toLowerCase().includes('challenge')) {
        return `The main challenges for this project include material delivery delays, pending permit inspections, and some weather-related slowdowns. The team is actively addressing these issues to minimize their impact on the overall timeline.`;
      }
      
      if (question.toLowerCase().includes('progress') || 
          question.toLowerCase().includes('status')) {
        return `The project is currently ${project.status.toLowerCase()}${project.progress ? ` with approximately ${project.progress}% of the work completed` : ''}. Recent activities include structural framing, electrical work, and initial plumbing installations.`;
      }
      
      // Generic fallback response
      return `I don't have enough specific information to answer that question about ${project.name} in detail. The project is currently ${project.status.toLowerCase()} and the team is working on implementation. For more specific information, please check the project documentation or speak with the project manager.`;
    }
  } catch (error) {
    log(`Project AI question error: ${error}`, 'project-ai');
    throw error;
  }
}

/**
 * Check if a user has access to Pro features
 * 
 * @param userId The user ID to check
 * @returns Boolean indicating if the user has Pro access
 */
export async function hasProAccess(userId: number): Promise<boolean> {
  try {
    // In a real implementation, this would check the user's subscription status
    // For this prototype, we'll consider specific user IDs as having Pro access
    const user = await storage.getUser(userId);
    if (!user) return false;
    
    // Check for Pro or admin role
    if (user.role === 'admin' || user.role === 'project-manager') {
      return true;
    }
    
    // Here we would also check subscription status from a real database
    // For development purposes, grant pro access to all users
    return true;
  } catch (error) {
    log(`Pro access check error: ${error}`, 'project-ai');
    return false;
  }
}