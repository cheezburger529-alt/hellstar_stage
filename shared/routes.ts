import { z } from 'zod';
import { userSchema, stageSchema, messageSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    adminLogin: {
      method: 'POST' as const,
      path: '/api/admin/login' as const,
      input: z.object({ password: z.string() }),
      responses: { 
        200: z.object({ success: z.boolean() }), 
        401: errorSchemas.validation 
      }
    },
    hostLogin: {
      method: 'POST' as const,
      path: '/api/host/login' as const,
      input: z.object({ password: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.validation
      }
    },
    join: {
      method: 'POST' as const,
      path: '/api/join' as const,
      input: z.object({ username: z.string() }),
      responses: { 
        200: userSchema, 
        400: errorSchemas.validation 
      }
    }
  },
  stage: {
    get: {
      method: 'GET' as const,
      path: '/api/stage' as const,
      responses: { 200: stageSchema.nullable() }
    },
    create: {
      method: 'POST' as const,
      path: '/api/stage' as const,
      input: z.object({ name: z.string(), description: z.string(), maxSpeakers: z.number().optional() }),
      responses: { 
        200: z.object({
          stage: stageSchema,
          hostPassword: z.string(),
          hostUsername: z.string(),
        }),
        401: errorSchemas.validation 
      }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/stage' as const,
      input: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        password: z.string(),
      }),
      responses: { 200: stageSchema, 401: errorSchemas.validation }
    },
    end: {
      method: 'DELETE' as const,
      path: '/api/stage' as const,
      responses: { 200: z.object({ success: z.boolean() }), 401: errorSchemas.validation }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export const ws = {
  send: {
    joinStage: z.object({ username: z.string() }),
    chatMessage: z.object({ text: z.string() }),
    raiseHand: z.object({ state: z.boolean() }),
    toggleMedia: z.object({ type: z.enum(['mic', 'camera']), state: z.boolean() }),
    webrtcOffer: z.object({ targetId: z.string(), sdp: z.any() }),
    webrtcAnswer: z.object({ targetId: z.string(), sdp: z.any() }),
    webrtcIceCandidate: z.object({ targetId: z.string(), candidate: z.any() }),
    adminAction: z.object({
      action: z.enum(['approveHand', 'rejectHand', 'removeSpeaker', 'kickUser', 'muteChat', 'muteMic', 'disableCamera', 'inviteToStage']),
      targetId: z.string().optional()
    })
  },
  receive: {
    stateUpdate: z.object({ stage: stageSchema.nullable(), users: z.array(userSchema) }),
    chatMessage: messageSchema,
    kicked: z.object({ reason: z.string() }),
    invitedToSpeak: z.object({}),
    mediaChanged: z.object({ userId: z.string(), type: z.enum(['mic', 'camera']), state: z.boolean() }),
    webrtcOffer: z.object({ sourceId: z.string(), sdp: z.any() }),
    webrtcAnswer: z.object({ sourceId: z.string(), sdp: z.any() }),
    webrtcIceCandidate: z.object({ sourceId: z.string(), candidate: z.any() }),
  }
};
