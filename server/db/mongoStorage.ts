import { IStorage } from '../storage';
import mongoose from 'mongoose';
import { 
  User, Jobsite, WeatherAlert, Command, ChatMessage, MessageReaction,
  IUser, IJobsite, IWeatherAlert, ICommand, IChatMessage, IMessageReaction
} from './models';
import { connectToDatabase } from './connection';
import { 
  User as UserType,
  Jobsite as JobsiteType,
  WeatherAlert as WeatherAlertType,
  Command as CommandType,
  ChatMessage as ChatMessageType,
  MessageReaction as MessageReactionType,
  InsertUser,
  InsertJobsite,
  InsertWeatherAlert,
  InsertCommand,
  InsertChatMessage,
  InsertMessageReaction
} from '../../shared/schema';
import { log } from '../vite';

// Safely handle error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error || 'Unknown error');
}

// Helper to convert MongoDB document to plain object
function documentToObject<T extends { _id: any, toObject: () => any }>(doc: T): any {
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

export class MongoStorage implements IStorage {
  constructor() {
    // Connect to the database when first initialized
    this.init();
  }

  private async init() {
    try {
      // Connect to database (this will use the MongoDB Memory Server)
      await connectToDatabase();
      log('MongoDB storage initialized successfully', 'mongodb');
      
      // Wait a bit to ensure the connection is established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check connection state
      const connected = mongoose.connection.readyState === 1;
      if (!connected) {
        log('MongoDB connection not ready. Retrying...', 'mongodb');
        await connectToDatabase();
      }
      
      // Check if there are any users, if not create a default one
      const userCount = await User.countDocuments();
      log(`Found ${userCount} users in the database`, 'mongodb');
      
      if (userCount === 0) {
        log('No users found. Creating sample data...', 'mongodb');
        await this.initSampleData();
      }
    } catch (error) {
      log(`Error initializing MongoDB storage: ${getErrorMessage(error)}`, 'mongodb');
      log('Falling back to memory storage...', 'mongodb');
      // Don't throw error so the app can continue with memory storage if needed
    }
  }

  // User methods
  async getUser(id: number): Promise<UserType | undefined> {
    try {
      const user = await User.findById(id);
      return user ? documentToObject(user) : undefined;
    } catch (error) {
      log(`Error getting user by id: ${getErrorMessage(error)}`, 'mongodb');
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ username });
      return user ? documentToObject(user) : undefined;
    } catch (error) {
      log(`Error getting user by username: ${getErrorMessage(error)}`, 'mongodb');
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<UserType> {
    try {
      const newUser = new User(user);
      const savedUser = await newUser.save();
      return documentToObject(savedUser);
    } catch (error) {
      log(`Error creating user: ${getErrorMessage(error)}`, 'mongodb');
      throw error;
    }
  }

  // Jobsite methods
  async getJobsites(): Promise<JobsiteType[]> {
    try {
      const jobsites = await Jobsite.find().sort({ startDate: -1 });
      return jobsites.map(documentToObject);
    } catch (error) {
      log(`Error getting jobsites: ${getErrorMessage(error)}`, 'mongodb');
      return [];
    }
  }

  async getJobsite(id: number): Promise<JobsiteType | undefined> {
    try {
      const jobsite = await Jobsite.findById(id);
      return jobsite ? documentToObject(jobsite) : undefined;
    } catch (error) {
      log(`Error getting jobsite: ${getErrorMessage(error)}`, 'mongodb');
      return undefined;
    }
  }

  async createJobsite(jobsite: InsertJobsite): Promise<JobsiteType> {
    try {
      const newJobsite = new Jobsite(jobsite);
      const savedJobsite = await newJobsite.save();
      return documentToObject(savedJobsite);
    } catch (error) {
      log(`Error creating jobsite: ${getErrorMessage(error)}`, 'mongodb');
      throw error;
    }
  }

  async updateJobsiteStatus(id: number, status: string): Promise<JobsiteType | undefined> {
    try {
      const jobsite = await Jobsite.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      return jobsite ? documentToObject(jobsite) : undefined;
    } catch (error) {
      log(`Error updating jobsite status: ${getErrorMessage(error)}`, 'mongodb');
      return undefined;
    }
  }

  async updateJobsiteDates(id: number, startDate: Date, endDate?: Date): Promise<JobsiteType | undefined> {
    try {
      const updateData: any = { startDate };
      if (endDate) {
        updateData.endDate = endDate;
      }
      
      const jobsite = await Jobsite.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      return jobsite ? documentToObject(jobsite) : undefined;
    } catch (error) {
      log(`Error updating jobsite dates: ${getErrorMessage(error)}`, 'mongodb');
      return undefined;
    }
  }

  // Weather alert methods
  async getWeatherAlerts(): Promise<WeatherAlertType[]> {
    try {
      const alerts = await WeatherAlert.find().sort({ startTime: -1 });
      return alerts.map(documentToObject);
    } catch (error) {
      log(`Error getting weather alerts: ${getErrorMessage(error)}`, 'mongodb');
      return [];
    }
  }

  async createWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlertType> {
    try {
      const newAlert = new WeatherAlert(alert);
      const savedAlert = await newAlert.save();
      return documentToObject(savedAlert);
    } catch (error) {
      log(`Error creating weather alert: ${getErrorMessage(error)}`, 'mongodb');
      throw error;
    }
  }

  // Command methods
  async getRecentCommands(limit: number = 10): Promise<CommandType[]> {
    try {
      const commands = await Command.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'name');
      return commands.map(documentToObject);
    } catch (error) {
      log(`Error getting recent commands: ${getErrorMessage(error)}`, 'mongodb');
      return [];
    }
  }

  async createCommand(command: InsertCommand): Promise<CommandType> {
    try {
      const newCommand = new Command(command);
      const savedCommand = await newCommand.save();
      return documentToObject(savedCommand);
    } catch (error) {
      log(`Error creating command: ${getErrorMessage(error)}`, 'mongodb');
      throw error;
    }
  }

  // Chat message methods
  async getChatMessages(limit: number = 20): Promise<ChatMessageType[]> {
    try {
      const messages = await ChatMessage.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'name')
        .populate('jobsiteId', 'name');
      return messages.map(documentToObject);
    } catch (error) {
      log(`Error getting chat messages: ${getErrorMessage(error)}`, 'mongodb');
      return [];
    }
  }

  async getChatMessagesByJobsite(jobsiteId: number, limit: number = 20): Promise<ChatMessageType[]> {
    try {
      const messages = await ChatMessage.find({ jobsiteId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'name')
        .populate('jobsiteId', 'name');
      return messages.map(documentToObject);
    } catch (error) {
      log(`Error getting chat messages by jobsite: ${getErrorMessage(error)}`, 'mongodb');
      return [];
    }
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessageType> {
    try {
      const newMessage = new ChatMessage(message);
      const savedMessage = await newMessage.save();
      return documentToObject(savedMessage);
    } catch (error) {
      log(`Error creating chat message: ${getErrorMessage(error)}`, 'mongodb');
      throw error;
    }
  }

  async markMessageAsCalendarEvent(id: number, title: string): Promise<ChatMessageType | undefined> {
    try {
      const message = await ChatMessage.findByIdAndUpdate(
        id,
        { 
          isCalendarEvent: true,
          eventTitle: title,
          eventDate: new Date() // Default to current date if not specified
        },
        { new: true }
      );
      return message ? documentToObject(message) : undefined;
    } catch (error) {
      log(`Error marking message as calendar event: ${getErrorMessage(error)}`, 'mongodb');
      return undefined;
    }
  }

  // Calendar events
  async getCalendarEvents(startDate?: Date, endDate?: Date): Promise<Array<JobsiteType | ChatMessageType>> {
    try {
      const query: any = {};
      if (startDate) {
        query.startDate = { $gte: startDate };
      }
      if (endDate) {
        query.endDate = { $lte: endDate };
      } else if (startDate) {
        // If only startDate is provided, include all events from that date forward
        query.startDate = { $gte: startDate };
      }

      // Get all jobsites within the date range
      const jobsites = await Jobsite.find(query);

      // Get all chat messages that are calendar events
      let messageQuery: any = { isCalendarEvent: true };
      if (startDate) {
        messageQuery.eventDate = { $gte: startDate };
      }
      if (endDate) {
        if (messageQuery.eventDate) {
          messageQuery.eventDate.$lte = endDate;
        } else {
          messageQuery.eventDate = { $lte: endDate };
        }
      }

      const messages = await ChatMessage.find(messageQuery);

      // Combine and return
      return [
        ...jobsites.map(documentToObject),
        ...messages.map(documentToObject)
      ];
    } catch (error) {
      log(`Error getting calendar events: ${getErrorMessage(error)}`, 'mongodb');
      return [];
    }
  }

  // Message reaction methods
  async addReactionToMessage(messageId: number, userId: number, emoji: string): Promise<ChatMessageType | undefined> {
    try {
      // First, check if the reaction already exists
      const existingReaction = await MessageReaction.findOne({
        messageId,
        userId,
        emoji
      });

      if (!existingReaction) {
        // Create a new reaction
        const reaction = new MessageReaction({
          messageId,
          userId,
          emoji
        });
        await reaction.save();
      }

      // Update the reactions on the message
      const message = await ChatMessage.findById(messageId);
      if (!message) return undefined;

      // Get all reactions for this message
      const reactions = await this.getMessageReactions(messageId);
      
      // Update the message with the reactions
      message.reactions = new Map(Object.entries(reactions));
      await message.save();

      return documentToObject(message);
    } catch (error) {
      log(`Error adding reaction to message: ${getErrorMessage(error)}`, 'mongodb');
      return undefined;
    }
  }

  async removeReactionFromMessage(messageId: number, userId: number, emoji: string): Promise<ChatMessageType | undefined> {
    try {
      // Remove the reaction
      await MessageReaction.deleteOne({
        messageId,
        userId,
        emoji
      });

      // Update the message with the remaining reactions
      const message = await ChatMessage.findById(messageId);
      if (!message) return undefined;

      // Get all remaining reactions for this message
      const reactions = await this.getMessageReactions(messageId);
      
      // Update the message with the reactions
      message.reactions = new Map(Object.entries(reactions));
      await message.save();

      return documentToObject(message);
    } catch (error) {
      log(`Error removing reaction from message: ${getErrorMessage(error)}`, 'mongodb');
      return undefined;
    }
  }

  async getMessageReactions(messageId: number): Promise<Record<string, string[]>> {
    try {
      const reactions = await MessageReaction.find({ messageId })
        .populate('userId', 'name');
      
      // Group reactions by emoji
      const groupedReactions: Record<string, string[]> = {};
      
      for (const reaction of reactions) {
        const userObj = reaction.userId as unknown as IUser;
        if (!groupedReactions[reaction.emoji]) {
          groupedReactions[reaction.emoji] = [];
        }
        groupedReactions[reaction.emoji].push(userObj.name);
      }
      
      return groupedReactions;
    } catch (error) {
      log(`Error getting message reactions: ${getErrorMessage(error)}`, 'mongodb');
      return {};
    }
  }

  // Initialize sample data
  private async initSampleData() {
    try {
      // Create default user
      const defaultUser = new User({
        name: "Mike Johnson",
        username: "mike",
        password: "password", // In a real app, hash this password
        role: "Site Manager",
        email: "mike@construction.com",
        phone: "+1-555-123-4567"
      });
      const user = await defaultUser.save();
      
      // Create sample jobsites
      const jobsite1 = new Jobsite({
        name: "Downtown Renovation",
        location: "123 Main St, Downtown",
        status: "in-progress",
        clientName: "City Development Corp",
        description: "Major renovation of the downtown shopping district",
        startDate: new Date("2025-03-15"),
        endDate: new Date("2025-09-30"),
        latitude: 40.7128,
        longitude: -74.0060
      });
      
      const jobsite2 = new Jobsite({
        name: "Riverside Apartments",
        location: "456 River Rd, Riverside",
        status: "planned",
        clientName: "River View Properties",
        description: "New apartment complex with 200 units",
        startDate: new Date("2025-06-01"),
        latitude: 40.7589,
        longitude: -73.9851
      });
      
      const jobsite3 = new Jobsite({
        name: "Highland Office Park",
        location: "789 Highland Ave, Highland",
        status: "completed",
        clientName: "Highland Business Group",
        description: "Office park with 5 buildings and landscaping",
        startDate: new Date("2024-10-15"),
        endDate: new Date("2025-03-01"),
        latitude: 40.8224,
        longitude: -73.9495
      });
      
      await Promise.all([
        jobsite1.save(),
        jobsite2.save(),
        jobsite3.save()
      ]);
      
      // Create weather alert
      const weatherAlert = new WeatherAlert({
        message: "Heavy rain expected tomorrow. Secure loose materials.",
        severity: "warning",
        startTime: new Date("2025-04-06T08:00:00"),
        endTime: new Date("2025-04-06T20:00:00"),
        affectedJobsites: [jobsite1._id, jobsite2._id]
      });
      
      await weatherAlert.save();
      
      log('Sample data initialized successfully', 'mongodb');
    } catch (error) {
      log(`Error initializing sample data: ${getErrorMessage(error)}`, 'mongodb');
    }
  }
}