import mongoose, { Schema, Document } from 'mongoose';

// User model
export interface IUser extends Document {
  name: string;
  username: string;
  password: string;
  role: string;
  email?: string;
  phone?: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  preferences: { type: Map, of: Schema.Types.Mixed },
}, { timestamps: true });

// Jobsite model
export interface IJobsite extends Document {
  name: string;
  location: string;
  status: string;
  clientName: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

const jobsiteSchema = new Schema<IJobsite>({
  name: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, required: true },
  clientName: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  latitude: { type: Number },
  longitude: { type: Number },
}, { timestamps: true });

// Weather Alert model
export interface IWeatherAlert extends Document {
  message: string;
  severity: string;
  startTime: Date;
  endTime?: Date;
  affectedJobsites?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const weatherAlertSchema = new Schema<IWeatherAlert>({
  message: { type: String, required: true },
  severity: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  affectedJobsites: [{ type: Schema.Types.ObjectId, ref: 'Jobsite' }],
}, { timestamps: true });

// Command model
export interface ICommand extends Document {
  text: string;
  userId: mongoose.Types.ObjectId;
  jobsiteId?: mongoose.Types.ObjectId;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commandSchema = new Schema<ICommand>({
  text: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  jobsiteId: { type: Schema.Types.ObjectId, ref: 'Jobsite' },
  timestamp: { type: Date, required: true },
}, { timestamps: true });

// Chat Message model
export interface IChatMessage extends Document {
  text: string;
  translatedText?: string;
  userId: mongoose.Types.ObjectId;
  jobsiteId?: mongoose.Types.ObjectId;
  language: string;
  role: string;
  timestamp: Date;
  isCalendarEvent?: boolean;
  eventTitle?: string;
  eventDate?: Date;
  reactions?: Map<string, string[]>;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  text: { type: String, required: true },
  translatedText: { type: String },
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  jobsiteId: { type: Schema.Types.ObjectId, ref: 'Jobsite' },
  language: { type: String, required: true },
  role: { type: String, required: true },
  timestamp: { type: Date, required: true },
  isCalendarEvent: { type: Boolean, default: false },
  eventTitle: { type: String },
  eventDate: { type: Date },
  reactions: { type: Map, of: [String] },
}, { timestamps: true });

// Message Reaction model
export interface IMessageReaction extends Document {
  messageId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  emoji: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageReactionSchema = new Schema<IMessageReaction>({
  messageId: { type: Schema.Types.ObjectId, required: true, ref: 'ChatMessage' },
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  emoji: { type: String, required: true },
}, { timestamps: true });

// Create models
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const Jobsite = mongoose.models.Jobsite || mongoose.model<IJobsite>('Jobsite', jobsiteSchema);
export const WeatherAlert = mongoose.models.WeatherAlert || mongoose.model<IWeatherAlert>('WeatherAlert', weatherAlertSchema);
export const Command = mongoose.models.Command || mongoose.model<ICommand>('Command', commandSchema);
export const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
export const MessageReaction = mongoose.models.MessageReaction || mongoose.model<IMessageReaction>('MessageReaction', messageReactionSchema);