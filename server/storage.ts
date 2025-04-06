import { 
  User, InsertUser, users,
  Jobsite, InsertJobsite, jobsites,
  WeatherAlert, InsertWeatherAlert, weatherAlerts,
  Command, InsertCommand, commands,
  ChatMessage, InsertChatMessage, chatMessages,
  MessageReaction, InsertMessageReaction, messageReactions,
  CrewMember, InsertCrewMember, crewMembers
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Jobsite methods
  getJobsites(): Promise<Jobsite[]>;
  getJobsite(id: number): Promise<Jobsite | undefined>;
  createJobsite(jobsite: InsertJobsite): Promise<Jobsite>;
  updateJobsiteStatus(id: number, status: string): Promise<Jobsite | undefined>;
  updateJobsiteDates(id: number, startDate: Date, endDate?: Date): Promise<Jobsite | undefined>;

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
  
  private userCurrentId: number;
  private jobsiteCurrentId: number;
  private weatherAlertCurrentId: number;
  private commandCurrentId: number;
  private chatMessageCurrentId: number;
  private messageReactionCurrentId: number;
  private crewMemberCurrentId: number;

  constructor() {
    this.users = new Map();
    this.jobsites = new Map();
    this.weatherAlerts = new Map();
    this.commands = new Map();
    this.chatMessages = new Map();
    this.messageReactions = new Map();
    this.crewMembers = new Map();
    
    this.userCurrentId = 1;
    this.jobsiteCurrentId = 1;
    this.weatherAlertCurrentId = 1;
    this.commandCurrentId = 1;
    this.chatMessageCurrentId = 1;
    this.messageReactionCurrentId = 1;
    this.crewMemberCurrentId = 1;

    // Initialize with sample data
    this.initSampleData();
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
  
  // Initialize with sample data
  private initSampleData() {
    // Sample user
    const user: User = {
      id: this.userCurrentId++,
      name: 'Mike Johnson',
      role: 'Site Foreman',
      username: 'mike',
      password: 'password',
      avatar: ''
    };
    this.users.set(user.id, user);

    // Sample jobsites with calendar dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    const jobsite1: Jobsite = {
      id: this.jobsiteCurrentId++,
      name: 'Westside Project',
      address: '123 Main St, Building A',
      status: 'Delayed (20 min)',
      time: '10:00 AM',
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
      location: { lat: 34.0522, lng: -118.2437 }
    };
    this.jobsites.set(jobsite1.id, jobsite1);

    const jobsite2: Jobsite = {
      id: this.jobsiteCurrentId++,
      name: 'Downtown Renovation',
      address: '456 Center Ave, Floor 3',
      status: 'Weather Alert: Update Client',
      time: '1:00 PM',
      startDate: nextWeek.toISOString(),
      endDate: twoWeeksFromNow.toISOString(),
      location: { lat: 34.0522, lng: -118.2437 }
    };
    this.jobsites.set(jobsite2.id, jobsite2);

    const jobsite3: Jobsite = {
      id: this.jobsiteCurrentId++,
      name: 'Eastside Construction',
      address: '789 East Blvd, Tower B',
      status: 'On Time',
      time: '3:30 PM',
      startDate: tomorrow.toISOString(),
      endDate: nextWeek.toISOString(),
      location: { lat: 34.0522, lng: -118.2437 }
    };
    this.jobsites.set(jobsite3.id, jobsite3);

    // Sample weather alert
    const weatherAlert: WeatherAlert = {
      id: this.weatherAlertCurrentId++,
      title: 'Heavy Rain Warning',
      location: 'Downtown Area',
      duration: 'Expected until 3PM',
      impact: 'All exterior work delayed - Client notified'
    };
    this.weatherAlerts.set(weatherAlert.id, weatherAlert);

    // Sample commands
    const commands = [
      {
        id: this.commandCurrentId++,
        text: "I'll be 20 minutes late to the Westside project",
        timestamp: new Date().toISOString(),
        userId: user.id,
        jobsiteId: jobsite1.id
      },
      {
        id: this.commandCurrentId++,
        text: "Need more concrete at Eastside construction",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        userId: user.id,
        jobsiteId: jobsite3.id
      },
      {
        id: this.commandCurrentId++,
        text: "Safety harness inspection needed at Downtown site",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        userId: user.id,
        jobsiteId: jobsite2.id
      }
    ];
    
    commands.forEach(cmd => this.commands.set(cmd.id, cmd));
    
    // Sample chat messages with calendar events
    const chatMessages = [
      {
        id: this.chatMessageCurrentId++,
        text: "Team meeting scheduled for tomorrow morning at 8AM",
        translatedText: "Reunión de equipo programada para mañana por la mañana a las 8 a.m.",
        isUser: true,
        role: "boss",
        language: "en",
        timestamp: new Date().toISOString(),
        userId: user.id,
        jobsiteId: jobsite1.id,
        calendarEvent: true,
        eventTitle: "Team Meeting - Westside Project"
      },
      {
        id: this.chatMessageCurrentId++,
        text: "Material delivery for Downtown Renovation arriving at 2PM",
        translatedText: "Entrega de material para Downtown Renovation llegando a las 2PM",
        isUser: true,
        role: "boss",
        language: "en",
        timestamp: new Date(tomorrow).toISOString(),
        userId: user.id,
        jobsiteId: jobsite2.id,
        calendarEvent: true,
        eventTitle: "Material Delivery - Downtown"
      },
      {
        id: this.chatMessageCurrentId++,
        text: "Safety inspection for Eastside Construction next Monday at 10AM",
        translatedText: "Inspección de seguridad para Eastside Construction el próximo lunes a las 10AM",
        isUser: true,
        role: "boss",
        language: "en",
        timestamp: nextWeek.toISOString(),
        userId: user.id,
        jobsiteId: jobsite3.id,
        calendarEvent: true,
        eventTitle: "Safety Inspection - Eastside"
      }
    ];
    
    chatMessages.forEach(msg => this.chatMessages.set(msg.id, msg));
    
    // Sample crew members
    const crewMembers = [
      {
        id: this.crewMemberCurrentId++,
        name: 'Carlos Rodriguez',
        role: 'Lead Electrician',
        phone: '555-1234',
        email: 'carlos@construction.com',
        jobsiteId: jobsite1.id,
        specialization: 'Electrical',
        experienceYears: 8,
        status: 'active',
        latitude: 34.052235,
        longitude: -118.243683,
        locationName: 'Westside Project - Building A',
        lastCheckIn: new Date(),
        profileImage: '/assets/crew1.png',
        certifications: ['Master Electrician', 'Safety Certified'],
        languages: ['en', 'es'],
        emergencyContact: 'Maria Rodriguez: 555-9876',
        notes: 'Specializes in commercial wiring systems',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.crewMemberCurrentId++,
        name: 'Sarah Johnson',
        role: 'Project Manager',
        phone: '555-5678',
        email: 'sarah@construction.com',
        jobsiteId: jobsite2.id,
        specialization: 'Project Management',
        experienceYears: 12,
        status: 'active',
        latitude: 34.045124,
        longitude: -118.267294,
        locationName: 'Downtown Renovation - Floor 3',
        lastCheckIn: new Date(),
        profileImage: '/assets/crew2.png',
        certifications: ['PMP Certified', 'OSHA Certified'],
        languages: ['en'],
        emergencyContact: 'Michael Johnson: 555-4567',
        notes: 'Manages all downtown projects',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.crewMemberCurrentId++,
        name: 'Miguel Sanchez',
        role: 'Concrete Specialist',
        phone: '555-3434',
        email: 'miguel@construction.com',
        jobsiteId: jobsite3.id,
        specialization: 'Concrete/Foundation',
        experienceYears: 15,
        status: 'active',
        latitude: 34.074442,
        longitude: -118.243459,
        locationName: 'Eastside Construction - Foundation Area',
        lastCheckIn: new Date(),
        profileImage: '/assets/crew3.png',
        certifications: ['Concrete Specialist', 'Heavy Equipment Operator'],
        languages: ['es', 'en'],
        emergencyContact: 'Ana Sanchez: 555-7878',
        notes: 'Expert in complex foundation work',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.crewMemberCurrentId++,
        name: 'James Williams',
        role: 'Plumber',
        phone: '555-8989',
        email: 'james@construction.com',
        jobsiteId: jobsite1.id,
        specialization: 'Plumbing',
        experienceYears: 7,
        status: 'active',
        latitude: 34.052789,
        longitude: -118.242912,
        locationName: 'Westside Project - Building A, Floor 2',
        lastCheckIn: new Date(),
        profileImage: '/assets/crew4.png',
        certifications: ['Master Plumber', 'Gas Line Certified'],
        languages: ['en'],
        emergencyContact: 'Lisa Williams: 555-1111',
        notes: 'Specializes in commercial plumbing systems',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.crewMemberCurrentId++,
        name: 'Elena Martinez',
        role: 'HVAC Technician',
        phone: '555-2222',
        email: 'elena@construction.com',
        jobsiteId: jobsite2.id,
        specialization: 'HVAC',
        experienceYears: 6,
        status: 'active',
        latitude: 34.046134,
        longitude: -118.265912,
        locationName: 'Downtown Renovation - Mechanical Room',
        lastCheckIn: new Date(),
        profileImage: '/assets/crew5.png',
        certifications: ['HVAC Certified', 'Energy Efficiency Specialist'],
        languages: ['en', 'es'],
        emergencyContact: 'Roberto Martinez: 555-3333',
        notes: 'Expert in energy-efficient HVAC systems',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    crewMembers.forEach(member => this.crewMembers.set(member.id, member));
  }
}

export const storage = new MemStorage();
