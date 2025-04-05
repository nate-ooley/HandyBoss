import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
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
