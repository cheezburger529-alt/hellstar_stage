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

const pollOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  votes: z.number().default(0),
});

const pollSchema = z.object({
  id: z.string(),
  options: z.array(pollOptionSchema),
  voters: z.array(z.string()).default([]), // userIds that have already voted
  endsAt: z.number().nullable().default(null), // timestamp in ms when poll auto-ends
});

export const stageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  maxSpeakers: z.number().default(8),
  isActive: z.boolean().default(false),
  // Chat/Q&A controls
  chatLocked: z.boolean().default(false),
  qnaEnabled: z.boolean().default(false),
  pinnedQuestionId: z.string().nullable().default(null),
  activePoll: pollSchema.nullable().default(null),
});

export const messageSchema = z.object({
  id: z.string(),
  username: z.string(),
  text: z.string(),
  timestamp: z.number(),
  kind: z.enum(['chat', 'question', 'system']).default('chat'),
  upvotes: z.number().default(0),
});

export type User = z.infer<typeof userSchema>;
export type Stage = z.infer<typeof stageSchema>;
export type ChatMessage = z.infer<typeof messageSchema>;
export type Poll = z.infer<typeof pollSchema>;
