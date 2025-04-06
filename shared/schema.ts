import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  email: text("email"),
  phone: text("phone"),
  notificationPreference: text("notification_preference").default("none"), // none, email, sms, both
});

export const jobsites = pgTable("jobsites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  status: text("status").notNull(),
  time: text("time").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  location: json("location").$type<{ lat: number; lng: number }>(),
});

export const weatherAlerts = pgTable("weather_alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  duration: text("duration").notNull(),
  impact: text("impact").notNull(),
});

export const commands = pgTable("commands", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  userId: integer("user_id").references(() => users.id),
  jobsiteId: integer("jobsite_id").references(() => jobsites.id),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  translatedText: text("translated_text"),
  isUser: boolean("is_user").notNull(),
  role: text("role").notNull().default("worker"),
  language: text("language").notNull().default("en"),
  timestamp: timestamp("timestamp").notNull(),
  userId: integer("user_id").references(() => users.id),
  jobsiteId: integer("jobsite_id").references(() => jobsites.id),
  location: json("location").$type<{ lat: number; lng: number; address?: string }>(),
  calendarEvent: boolean("calendar_event").default(false),
  eventTitle: text("event_title"),
  reactions: json("reactions").$type<Record<string, string[]>>(),
});

export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => chatMessages.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  emoji: text("emoji").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  role: true,
  username: true,
  password: true,
  avatar: true,
});

export const insertJobsiteSchema = createInsertSchema(jobsites);

export const insertWeatherAlertSchema = createInsertSchema(weatherAlerts);

export const insertCommandSchema = createInsertSchema(commands);

export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertMessageReactionSchema = createInsertSchema(messageReactions);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertJobsite = z.infer<typeof insertJobsiteSchema>;
export type Jobsite = typeof jobsites.$inferSelect;

export type InsertWeatherAlert = z.infer<typeof insertWeatherAlertSchema>;
export type WeatherAlert = typeof weatherAlerts.$inferSelect;

export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type Command = typeof commands.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;

// Crew members schema
export const crewMembers = pgTable("crew_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  phone: text("phone"),
  email: text("email"),
  jobsiteId: integer("jobsite_id").references(() => jobsites.id),
  specialization: text("specialization"), // e.g., "Electrician", "Plumber", "Carpenter"
  experienceYears: integer("experience_years"),
  status: text("status").default("active"), // "active", "on-leave", "terminated"
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationName: text("location_name"),
  lastCheckIn: timestamp("last_check_in"),
  profileImage: text("profile_image"), // URL to profile image
  certifications: text("certifications").array(),
  languages: text("languages").array(),
  emergencyContact: text("emergency_contact"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCrewMemberSchema = createInsertSchema(crewMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCrewMember = z.infer<typeof insertCrewMemberSchema>;
export type CrewMember = typeof crewMembers.$inferSelect;
