import { 
  User, InsertUser, users,
  Jobsite, InsertJobsite, jobsites,
  WeatherAlert, InsertWeatherAlert, weatherAlerts,
  Command, InsertCommand, commands,
  ChatMessage, InsertChatMessage, chatMessages
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

  // Weather alert methods
  getWeatherAlerts(): Promise<WeatherAlert[]>;
  createWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlert>;

  // Command methods
  getRecentCommands(limit?: number): Promise<Command[]>;
  createCommand(command: InsertCommand): Promise<Command>;

  // Chat message methods
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobsites: Map<number, Jobsite>;
  private weatherAlerts: Map<number, WeatherAlert>;
  private commands: Map<number, Command>;
  private chatMessages: Map<number, ChatMessage>;
  
  private userCurrentId: number;
  private jobsiteCurrentId: number;
  private weatherAlertCurrentId: number;
  private commandCurrentId: number;
  private chatMessageCurrentId: number;

  constructor() {
    this.users = new Map();
    this.jobsites = new Map();
    this.weatherAlerts = new Map();
    this.commands = new Map();
    this.chatMessages = new Map();
    
    this.userCurrentId = 1;
    this.jobsiteCurrentId = 1;
    this.weatherAlertCurrentId = 1;
    this.commandCurrentId = 1;
    this.chatMessageCurrentId = 1;

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

    // Sample jobsites
    const jobsite1: Jobsite = {
      id: this.jobsiteCurrentId++,
      name: 'Westside Project',
      address: '123 Main St, Building A',
      status: 'Delayed (20 min)',
      time: '10:00 AM',
      location: { lat: 34.0522, lng: -118.2437 }
    };
    this.jobsites.set(jobsite1.id, jobsite1);

    const jobsite2: Jobsite = {
      id: this.jobsiteCurrentId++,
      name: 'Downtown Renovation',
      address: '456 Center Ave, Floor 3',
      status: 'Weather Alert: Update Client',
      time: '1:00 PM',
      location: { lat: 34.0522, lng: -118.2437 }
    };
    this.jobsites.set(jobsite2.id, jobsite2);

    const jobsite3: Jobsite = {
      id: this.jobsiteCurrentId++,
      name: 'Eastside Construction',
      address: '789 East Blvd, Tower B',
      status: 'On Time',
      time: '3:30 PM',
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
  }
}

export const storage = new MemStorage();
