import { User, Stage, ChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getStage(): Promise<Stage | null>;
  createStage(name: string, description: string, maxSpeakers: number): Promise<Stage>;
  updateStage(updates: Partial<Stage>): Promise<Stage | null>;
  endStage(): Promise<void>;
  setHostPassword(password: string | null): Promise<void>;
  getHostPassword(): Promise<string | null>;
  
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  addUser(user: User): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  removeUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  
  addMessage(msg: ChatMessage): Promise<ChatMessage>;
  getMessages(): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private stage: Stage | null = null;
  private users: Map<string, User> = new Map();
  private messages: ChatMessage[] = [];
  private hostPassword: string | null = null;

  async getStage(): Promise<Stage | null> {
    return this.stage;
  }

  async createStage(name: string, description: string, maxSpeakers: number): Promise<Stage> {
    this.stage = {
      id: randomUUID(),
      name,
      description,
      maxSpeakers,
      isActive: true,
    };
    this.users.clear();
    this.messages = [];
    return this.stage;
  }

  async updateStage(updates: Partial<Stage>): Promise<Stage | null> {
    if (!this.stage) return null;
    this.stage = { ...this.stage, ...updates };
    return this.stage;
  }

  async endStage(): Promise<void> {
    this.stage = null;
    this.users.clear();
    this.messages = [];
    this.hostPassword = null;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async addUser(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async removeUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async addMessage(msg: ChatMessage): Promise<ChatMessage> {
    this.messages.push(msg);
    if (this.messages.length > 100) {
      this.messages.shift();
    }
    return msg;
  }

  async getMessages(): Promise<ChatMessage[]> {
    return this.messages;
  }

  async setHostPassword(password: string | null): Promise<void> {
    this.hostPassword = password;
  }

  async getHostPassword(): Promise<string | null> {
    return this.hostPassword;
  }
}

export const storage = new MemStorage();
