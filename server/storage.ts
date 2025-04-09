import { 
  User, InsertUser, users,
  Jobsite, InsertJobsite, jobsites,
  WeatherAlert, InsertWeatherAlert, weatherAlerts,
  Command, InsertCommand, commands,
  ChatMessage, InsertChatMessage, chatMessages,
  MessageReaction, InsertMessageReaction, messageReactions,
  CrewMember, InsertCrewMember, crewMembers,
  ProjectMember, InsertProjectMember, projectMembers,
  ProjectCommunication, InsertProjectCommunication, projectCommunications
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Jobsite/Project methods
  getJobsites(): Promise<Jobsite[]>;
  getJobsite(id: number): Promise<Jobsite | undefined>;
  getJobsitesByManager(managerId: number): Promise<Jobsite[]>;
  createJobsite(jobsite: InsertJobsite): Promise<Jobsite>;
  updateJobsite(id: number, data: Partial<InsertJobsite>): Promise<Jobsite | undefined>;
  updateJobsiteStatus(id: number, status: string): Promise<Jobsite | undefined>;
  updateJobsiteDates(id: number, startDate: Date, endDate?: Date): Promise<Jobsite | undefined>;
  updateJobsiteProgress(id: number, progress: number): Promise<Jobsite | undefined>;
  deleteJobsite(id: number): Promise<boolean>;

  // Project members methods
  getProjectMembers(projectId: number): Promise<ProjectMember[]>;
  getProjectMember(id: number): Promise<ProjectMember | undefined>;
  getProjectsByCrewMember(crewMemberId: number): Promise<Jobsite[]>;
  addProjectMember(projectMember: InsertProjectMember): Promise<ProjectMember>;
  updateProjectMember(id: number, data: Partial<InsertProjectMember>): Promise<ProjectMember | undefined>;
  removeProjectMember(id: number): Promise<boolean>;

  // Project communications methods
  getProjectCommunications(projectId: number, limit?: number): Promise<ProjectCommunication[]>;
  createProjectCommunication(communication: InsertProjectCommunication): Promise<ProjectCommunication>;
  markCommunicationAsRead(communicationId: number, userId: number): Promise<ProjectCommunication | undefined>;
  addReactionToProjectCommunication(communicationId: number, userId: number, emoji: string): Promise<ProjectCommunication | undefined>;
  removeReactionFromProjectCommunication(communicationId: number, userId: number, emoji: string): Promise<ProjectCommunication | undefined>;

  // Weather alert methods
  getWeatherAlerts(): Promise<WeatherAlert[]>;
  createWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlert>;

  // Command methods
  getRecentCommands(limit?: number): Promise<Command[]>;
  createCommand(command: InsertCommand): Promise<Command>;

  // Chat message methods
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  getChatMessagesByJobsite(jobsiteId: number, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessageAsCalendarEvent(id: number, title: string): Promise<ChatMessage | undefined>;
  
  // Calendar events
  getCalendarEvents(startDate?: Date, endDate?: Date): Promise<Array<Jobsite | ChatMessage>>;
  
  // Message reaction methods
  addReactionToMessage(messageId: number, userId: number, emoji: string): Promise<ChatMessage | undefined>;
  removeReactionFromMessage(messageId: number, userId: number, emoji: string): Promise<ChatMessage | undefined>;
  getMessageReactions(messageId: number): Promise<Record<string, string[]>>;
  
  // Crew member methods
  getCrewMembers(): Promise<CrewMember[]>;
  getCrewMembersByJobsite(jobsiteId: number): Promise<CrewMember[]>;
  getCrewMember(id: number): Promise<CrewMember | undefined>;
  createCrewMember(crewMember: InsertCrewMember): Promise<CrewMember>;
  updateCrewMember(id: number, data: Partial<InsertCrewMember>): Promise<CrewMember | undefined>;
  updateCrewMemberLocation(id: number, latitude: number, longitude: number, locationName?: string): Promise<CrewMember | undefined>;
  deleteCrewMember(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobsites: Map<number, Jobsite>;
  private weatherAlerts: Map<number, WeatherAlert>;
  private commands: Map<number, Command>;
  private chatMessages: Map<number, ChatMessage>;
  private messageReactions: Map<number, MessageReaction>;
  private crewMembers: Map<number, CrewMember>;
  private projectMembers: Map<number, ProjectMember>;
  private projectCommunications: Map<number, ProjectCommunication>;
  
  private userCurrentId: number;
  private jobsiteCurrentId: number;
  private weatherAlertCurrentId: number;
  private commandCurrentId: number;
  private chatMessageCurrentId: number;
  private messageReactionCurrentId: number;
  private crewMemberCurrentId: number;
  private projectMemberCurrentId: number;
  private projectCommunicationCurrentId: number;

  constructor() {
    this.users = new Map();
    this.jobsites = new Map();
    this.weatherAlerts = new Map();
    this.commands = new Map();
    this.chatMessages = new Map();
    this.messageReactions = new Map();
    this.crewMembers = new Map();
    this.projectMembers = new Map();
    this.projectCommunications = new Map();
    
    this.userCurrentId = 1;
    this.jobsiteCurrentId = 1;
    this.weatherAlertCurrentId = 1;
    this.commandCurrentId = 1;
    this.chatMessageCurrentId = 1;
    this.messageReactionCurrentId = 1;
    this.crewMemberCurrentId = 1;
    this.projectMemberCurrentId = 1;
    this.projectCommunicationCurrentId = 1;

    // Initialize with sample data if environment variable is set
    if (process.env.INIT_SAMPLE_DATA === 'true') {
      this.initSampleData();
    } else {
      console.log("[storage] Skipping sample data initialization.")
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Jobsite methods
  async getJobsites(): Promise<Jobsite[]> {
    return Array.from(this.jobsites.values());
  }

  async getJobsite(id: number): Promise<Jobsite | undefined> {
    return this.jobsites.get(id);
  }

  async createJobsite(insertJobsite: InsertJobsite): Promise<Jobsite> {
    const id = this.jobsiteCurrentId++;
    const jobsite: Jobsite = { ...insertJobsite, id };
    this.jobsites.set(id, jobsite);
    return jobsite;
  }

  async updateJobsiteStatus(id: number, status: string): Promise<Jobsite | undefined> {
    const jobsite = this.jobsites.get(id);
    if (!jobsite) return undefined;
    
    const updatedJobsite = { ...jobsite, status };
    this.jobsites.set(id, updatedJobsite);
    return updatedJobsite;
  }

  // Weather alert methods
  async getWeatherAlerts(): Promise<WeatherAlert[]> {
    return Array.from(this.weatherAlerts.values());
  }

  async createWeatherAlert(insertWeatherAlert: InsertWeatherAlert): Promise<WeatherAlert> {
    const id = this.weatherAlertCurrentId++;
    const weatherAlert: WeatherAlert = { ...insertWeatherAlert, id };
    this.weatherAlerts.set(id, weatherAlert);
    return weatherAlert;
  }

  // Command methods
  async getRecentCommands(limit: number = 10): Promise<Command[]> {
    return Array.from(this.commands.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createCommand(insertCommand: InsertCommand): Promise<Command> {
    const id = this.commandCurrentId++;
    const command: Command = { ...insertCommand, id };
    this.commands.set(id, command);
    return command;
  }

  // Chat message methods
  async getChatMessages(limit: number = 20): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, limit);
  }

  async createChatMessage(insertChatMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageCurrentId++;
    const chatMessage: ChatMessage = { ...insertChatMessage, id };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }
  
  async getChatMessagesByJobsite(jobsiteId: number, limit: number = 20): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.jobsiteId === jobsiteId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, limit);
  }
  
  async markMessageAsCalendarEvent(id: number, title: string): Promise<ChatMessage | undefined> {
    const message = this.chatMessages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { 
      ...message, 
      calendarEvent: true,
      eventTitle: title || `Event from message ${id}`
    };
    this.chatMessages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  async updateJobsiteDates(id: number, startDate: Date, endDate?: Date): Promise<Jobsite | undefined> {
    const jobsite = this.jobsites.get(id);
    if (!jobsite) return undefined;
    
    const updatedJobsite = { 
      ...jobsite, 
      startDate: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : undefined
    };
    this.jobsites.set(id, updatedJobsite);
    return updatedJobsite;
  }
  
  async getCalendarEvents(startDate?: Date, endDate?: Date): Promise<Array<Jobsite | ChatMessage>> {
    // Get jobsites with date information
    const jobsiteEvents = Array.from(this.jobsites.values())
      .filter(jobsite => jobsite.startDate !== undefined);
    
    // Get chat messages marked as calendar events
    const messageEvents = Array.from(this.chatMessages.values())
      .filter(message => message.calendarEvent === true);
    
    // Combine and filter by date range if provided
    let events = [...jobsiteEvents, ...messageEvents];
    
    if (startDate) {
      const startTime = startDate.getTime();
      events = events.filter(event => {
        const eventTime = "startDate" in event 
          ? new Date(event.startDate).getTime() 
          : new Date(event.timestamp).getTime();
        return eventTime >= startTime;
      });
    }
    
    if (endDate) {
      const endTime = endDate.getTime();
      events = events.filter(event => {
        const eventTime = "startDate" in event 
          ? new Date(event.startDate).getTime() 
          : new Date(event.timestamp).getTime();
        return eventTime <= endTime;
      });
    }
    
    return events;
  }

  // Message reaction methods
  async addReactionToMessage(messageId: number, userId: number, emoji: string): Promise<ChatMessage | undefined> {
    const message = this.chatMessages.get(messageId);
    if (!message) return undefined;
    
    // Create a reaction record
    const reactionId = this.messageReactionCurrentId++;
    const reaction: MessageReaction = {
      id: reactionId,
      messageId,
      userId,
      emoji,
      timestamp: new Date()
    };
    this.messageReactions.set(reactionId, reaction);
    
    // Update the message's reactions
    const reactions = message.reactions || {};
    const userArray = reactions[emoji] || [];
    
    // Check if user already added this reaction
    if (!userArray.includes(userId.toString())) {
      reactions[emoji] = [...userArray, userId.toString()];
    }
    
    const updatedMessage = { ...message, reactions };
    this.chatMessages.set(messageId, updatedMessage);
    
    return updatedMessage;
  }
  
  async removeReactionFromMessage(messageId: number, userId: number, emoji: string): Promise<ChatMessage | undefined> {
    const message = this.chatMessages.get(messageId);
    if (!message || !message.reactions) return undefined;
    
    const reactions = { ...message.reactions };
    const userArray = reactions[emoji] || [];
    
    // Filter out this user's reaction for this emoji
    const updatedUserArray = userArray.filter(id => id !== userId.toString());
    
    // If there are still users with this reaction, update the array, otherwise remove the emoji key
    if (updatedUserArray.length > 0) {
      reactions[emoji] = updatedUserArray;
    } else {
      delete reactions[emoji];
    }
    
    // Remove reaction records
    Array.from(this.messageReactions.values())
      .filter(r => r.messageId === messageId && r.userId === userId && r.emoji === emoji)
      .forEach(r => this.messageReactions.delete(r.id));
    
    const updatedMessage = { ...message, reactions };
    this.chatMessages.set(messageId, updatedMessage);
    
    return updatedMessage;
  }
  
  async getMessageReactions(messageId: number): Promise<Record<string, string[]>> {
    const message = this.chatMessages.get(messageId);
    if (!message) return {};
    
    return message.reactions || {};
  }
  
  // Crew member methods
  async getCrewMembers(): Promise<CrewMember[]> {
    return Array.from(this.crewMembers.values());
  }
  
  async getCrewMembersByJobsite(jobsiteId: number): Promise<CrewMember[]> {
    return Array.from(this.crewMembers.values())
      .filter(member => member.jobsiteId === jobsiteId);
  }
  
  async getCrewMember(id: number): Promise<CrewMember | undefined> {
    return this.crewMembers.get(id);
  }
  
  async createCrewMember(insertCrewMember: InsertCrewMember): Promise<CrewMember> {
    const id = this.crewMemberCurrentId++;
    const crewMember: CrewMember = { 
      ...insertCrewMember, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.crewMembers.set(id, crewMember);
    return crewMember;
  }
  
  async updateCrewMember(id: number, data: Partial<InsertCrewMember>): Promise<CrewMember | undefined> {
    const crewMember = this.crewMembers.get(id);
    if (!crewMember) return undefined;
    
    const updatedCrewMember = { 
      ...crewMember, 
      ...data,
      updatedAt: new Date()
    };
    this.crewMembers.set(id, updatedCrewMember);
    return updatedCrewMember;
  }
  
  async updateCrewMemberLocation(
    id: number, 
    latitude: number, 
    longitude: number, 
    locationName?: string
  ): Promise<CrewMember | undefined> {
    const crewMember = this.crewMembers.get(id);
    if (!crewMember) return undefined;
    
    const updatedCrewMember = { 
      ...crewMember, 
      latitude,
      longitude,
      locationName: locationName || crewMember.locationName,
      lastCheckIn: new Date(),
      updatedAt: new Date()
    };
    this.crewMembers.set(id, updatedCrewMember);
    return updatedCrewMember;
  }
  
  async deleteCrewMember(id: number): Promise<boolean> {
    if (!this.crewMembers.has(id)) {
      return false;
    }
    return this.crewMembers.delete(id);
  }
  
  // Additional Jobsite/Project methods
  async getJobsitesByManager(managerId: number): Promise<Jobsite[]> {
    return Array.from(this.jobsites.values())
      .filter(jobsite => jobsite.managerId === managerId);
  }
  
  async updateJobsite(id: number, data: Partial<InsertJobsite>): Promise<Jobsite | undefined> {
    const jobsite = this.jobsites.get(id);
    if (!jobsite) return undefined;
    
    const updatedJobsite = { 
      ...jobsite, 
      ...data,
      updatedAt: new Date()
    };
    this.jobsites.set(id, updatedJobsite);
    return updatedJobsite;
  }
  
  async updateJobsiteProgress(id: number, progress: number): Promise<Jobsite | undefined> {
    const jobsite = this.jobsites.get(id);
    if (!jobsite) return undefined;
    
    const updatedJobsite = { 
      ...jobsite, 
      progress,
      updatedAt: new Date()
    };
    this.jobsites.set(id, updatedJobsite);
    return updatedJobsite;
  }
  
  async deleteJobsite(id: number): Promise<boolean> {
    if (!this.jobsites.has(id)) {
      return false;
    }
    
    // Delete all associated project members
    const projectMembersToDelete = Array.from(this.projectMembers.values())
      .filter(member => member.projectId === id)
      .map(member => member.id);
    
    projectMembersToDelete.forEach(memberId => this.projectMembers.delete(memberId));
    
    // Delete all associated communications
    const communicationsToDelete = Array.from(this.projectCommunications.values())
      .filter(comm => comm.projectId === id)
      .map(comm => comm.id);
    
    communicationsToDelete.forEach(commId => this.projectCommunications.delete(commId));
    
    return this.jobsites.delete(id);
  }
  
  // Project members methods
  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    return Array.from(this.projectMembers.values())
      .filter(member => member.projectId === projectId);
  }
  
  async getProjectMember(id: number): Promise<ProjectMember | undefined> {
    return this.projectMembers.get(id);
  }
  
  async getProjectsByCrewMember(crewMemberId: number): Promise<Jobsite[]> {
    // Find all project IDs that this crew member is part of
    const projectIds = Array.from(this.projectMembers.values())
      .filter(member => member.crewMemberId === crewMemberId)
      .map(member => member.projectId);
    
    // Return all jobsites/projects that match these IDs
    return Array.from(this.jobsites.values())
      .filter(jobsite => projectIds.includes(jobsite.id));
  }
  
  async addProjectMember(projectMember: InsertProjectMember): Promise<ProjectMember> {
    const id = this.projectMemberCurrentId++;
    const newProjectMember: ProjectMember = { 
      ...projectMember, 
      id,
      assignedAt: new Date()
    };
    this.projectMembers.set(id, newProjectMember);
    return newProjectMember;
  }
  
  async updateProjectMember(id: number, data: Partial<InsertProjectMember>): Promise<ProjectMember | undefined> {
    const projectMember = this.projectMembers.get(id);
    if (!projectMember) return undefined;
    
    const updatedProjectMember = { ...projectMember, ...data };
    this.projectMembers.set(id, updatedProjectMember);
    return updatedProjectMember;
  }
  
  async removeProjectMember(id: number): Promise<boolean> {
    if (!this.projectMembers.has(id)) {
      return false;
    }
    return this.projectMembers.delete(id);
  }
  
  // Project communications methods
  async getProjectCommunications(projectId: number, limit: number = 50): Promise<ProjectCommunication[]> {
    return Array.from(this.projectCommunications.values())
      .filter(comm => comm.projectId === projectId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, limit);
  }
  
  async createProjectCommunication(communication: InsertProjectCommunication): Promise<ProjectCommunication> {
    const id = this.projectCommunicationCurrentId++;
    const newCommunication: ProjectCommunication = {
      ...communication,
      id,
      timestamp: new Date(),
      readBy: []
    };
    this.projectCommunications.set(id, newCommunication);
    return newCommunication;
  }
  
  async markCommunicationAsRead(communicationId: number, userId: number): Promise<ProjectCommunication | undefined> {
    const communication = this.projectCommunications.get(communicationId);
    if (!communication) return undefined;
    
    // Add userId to readBy array if not already there
    if (!communication.readBy.includes(userId)) {
      const updatedReadBy = [...communication.readBy, userId];
      const updatedCommunication = { ...communication, readBy: updatedReadBy };
      this.projectCommunications.set(communicationId, updatedCommunication);
      return updatedCommunication;
    }
    
    return communication;
  }
  
  async addReactionToProjectCommunication(communicationId: number, userId: number, emoji: string): Promise<ProjectCommunication | undefined> {
    const communication = this.projectCommunications.get(communicationId);
    if (!communication) return undefined;
    
    // Update the communication's reactions
    const reactions = communication.reactions || {};
    const userArray = reactions[emoji] || [];
    
    // Check if user already added this reaction
    if (!userArray.includes(userId.toString())) {
      reactions[emoji] = [...userArray, userId.toString()];
    }
    
    const updatedCommunication = { ...communication, reactions };
    this.projectCommunications.set(communicationId, updatedCommunication);
    
    return updatedCommunication;
  }
  
  async removeReactionFromProjectCommunication(communicationId: number, userId: number, emoji: string): Promise<ProjectCommunication | undefined> {
    const communication = this.projectCommunications.get(communicationId);
    if (!communication || !communication.reactions) return undefined;
    
    const reactions = { ...communication.reactions };
    const userArray = reactions[emoji] || [];
    
    // Filter out this user's reaction for this emoji
    const updatedUserArray = userArray.filter(id => id !== userId.toString());
    
    // If there are still users with this reaction, update the array, otherwise remove the emoji key
    if (updatedUserArray.length > 0) {
      reactions[emoji] = updatedUserArray;
    } else {
      delete reactions[emoji];
    }
    
    const updatedCommunication = { ...communication, reactions };
    this.projectCommunications.set(communicationId, updatedCommunication);
    
    return updatedCommunication;
  }
  
  // Initialize with sample data
  private initSampleData() {
    console.log("[storage] Initializing with SIMPLIFIED sample data (User and Jobsites only)...");

    // Sample user (Minimal required fields + fields from previous errors)
    const user: User = {
      id: this.userCurrentId++, 
      name: 'Mike Johnson',
      username: 'mike',
      password: 'password',
      role: 'Site Foreman', // Assuming required
      avatar: null, 
      email: 'mike@example.com', // Added based on errors
      phone: '555-0101', // Added based on errors
      notificationPreference: 'email', // Added based on errors
      settings: {} // Added based on errors
    };
    this.users.set(user.id, user);

    // Sample jobsites (Minimal required fields + fields from previous errors)
    const jobsitesData: Jobsite[] = [
      {
        id: this.jobsiteCurrentId++, 
        name: "Downtown Port Charlotte Renovation",
        address: "123 Marion Ave, Punta Gorda, FL 33950", // Required?
        status: "active", // Required for map
        time: "8:00 AM", // Required?
        startDate: new Date("2024-07-01"), // Required Date | null?
        endDate: new Date("2024-12-15"), // Required Date | null?
        location: { lat: 26.9337, lng: -82.0493 }, // Required?
        latitude: 26.9337, // Required for map
        longitude: -82.0493, // Required for map
        description: "Complete overhaul of downtown block.", // Required?
        clientName: "City Development Corp", // Required?
        progress: 65, // Required?
        managerId: user.id, // Required?
        updatedAt: new Date(), // Required?
        crewMembers: [] // Required? Initialize as empty
      },
      {
        id: this.jobsiteCurrentId++,
        name: "North Port Retail Build-out",
        address: "456 Toledo Blade Blvd, North Port, FL 34288", // Required?
        status: "scheduled", // Required for map
        time: "9:00 AM", // Required?
        startDate: new Date("2024-08-15"), // Required Date | null?
        endDate: null, // Required Date | null? Explicitly null
        location: { lat: 27.0639, lng: -82.1618 }, // Required?
        latitude: 27.0639, // Required for map
        longitude: -82.1618, // Required for map
        description: "Interior build-out for new retail space.", // Required?
        clientName: "Sunshine Retailers", // Required?
        progress: 0, // Required?
        managerId: user.id, // Required?
        updatedAt: new Date(), // Required?
        crewMembers: [] // Required? Initialize as empty
      },
       {
        id: this.jobsiteCurrentId++,
        name: "Englewood Beach Condos",
        address: "789 Beach Rd, Englewood, FL 34223", // Required?
        status: "active", // Required for map
        time: "10:00 AM", // Required?
        startDate: new Date("2024-05-01"), // Required Date | null?
        endDate: new Date("2024-11-30"), // Required Date | null?
        location: { lat: 26.9498, lng: -82.3584 }, // Required?
        latitude: 26.9498, // Required for map
        longitude: -82.3584, // Required for map
        description: "New luxury beachfront condo construction.", // Required?
        clientName: "Coastal Living Inc.", // Required?
        progress: 30, // Required?
        managerId: user.id, // Required?
        updatedAt: new Date(), // Required?
        crewMembers: [] // Required? Initialize as empty
      },
    ];
    
    this.jobsites = new Map();
    jobsitesData.forEach(jobsite => {
      this.jobsites.set(jobsite.id, jobsite);
    });

    // --- All other sample data creation is commented out --- 

    console.log(`[storage] SIMPLIFIED Sample data initialization complete. Users: ${this.users.size}, Jobsites: ${this.jobsites.size}`);
  }
}

// Determine storage implementation based on environment variables
let storage: IStorage;
const useMongoDB = process.env.USE_MONGO_DB === 'true';

if (useMongoDB) {
  // Dynamically import MongoDBStorage only if needed
  import('./mongodbStorage').then(({ MongoDBStorage }) => {
    storage = new MongoDBStorage();
    console.log("[storage] Using MongoDB storage implementation");
  }).catch(error => {
    console.error("[storage] Failed to load MongoDBStorage, falling back to MemStorage:", error);
    storage = new MemStorage();
    console.log("[storage] Using in-memory storage implementation (fallback)");
  });
} else {
  storage = new MemStorage();
  console.log("[storage] Using in-memory storage implementation");
}

export { storage };
