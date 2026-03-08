import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  username: z.string().regex(/^@[a-zA-Z0-9_]{2,19}$/, "Username must start with @ and be 3-20 chars"),
  isSpeaker: z.boolean().default(false),
  micOn: z.boolean().default(false),
  cameraOn: z.boolean().default(false),
  handRaised: z.boolean().default(false),
  isBanned: z.boolean().default(false),
  chatMuted: z.boolean().default(false),
});

export const stageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  maxSpeakers: z.number().default(8),
  isActive: z.boolean().default(false),
});

export const messageSchema = z.object({
  id: z.string(),
  username: z.string(),
  text: z.string(),
  timestamp: z.number(),
});

export type User = z.infer<typeof userSchema>;
export type Stage = z.infer<typeof stageSchema>;
export type ChatMessage = z.infer<typeof messageSchema>;
