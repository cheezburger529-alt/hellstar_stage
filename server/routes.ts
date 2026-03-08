import type { Express } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { Server as SocketIOServer } from "socket.io";
import { randomUUID } from "crypto";
import { api, ws } from "@shared/routes";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const HOST_USERNAME = "@Host_Account_9148";

  function generateHostPassword(): string {
    return randomUUID().replace(/-/g, "").slice(0, 12);
  }

  app.post(api.auth.adminLogin.path, (req, res) => {
    try {
      const input = api.auth.adminLogin.input.parse(req.body);
      if (input.password === "GG_/(())_ROCKSTAR") {
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } catch (e: any) {
      res.status(401).json({ message: "Invalid input" });
    }
  });

  app.post(api.auth.hostLogin.path, async (req, res) => {
    try {
      const input = api.auth.hostLogin.input.parse(req.body);
      const current = await storage.getHostPassword();
      if (current && input.password === current) {
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } catch (e: any) {
      res.status(401).json({ message: "Invalid input" });
    }
  });

  app.post(api.auth.join.path, async (req, res) => {
    try {
      const input = api.auth.join.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already in use" });
      }
      // Provide a stub user response, actual connection via socket
      res.json({
        id: "pending",
        username: input.username,
        isSpeaker: false,
        micOn: false,
        cameraOn: false,
        handRaised: false,
        isBanned: false,
        chatMuted: false,
      });
    } catch (e: any) {
      res.status(400).json({ message: "Invalid username" });
    }
  });

  app.get(api.stage.get.path, async (req, res) => {
    const stage = await storage.getStage();
    res.json(stage);
  });

  app.post(api.stage.create.path, async (req, res) => {
    try {
      const input = api.stage.create.input.parse(req.body);
      const stage = await storage.createStage(input.name, input.description, input.maxSpeakers || 8);
      const hostPassword = generateHostPassword();
      await storage.setHostPassword(hostPassword);
      broadcastStateUpdate();
      res.json({ stage, hostPassword, hostUsername: HOST_USERNAME });
    } catch (e: any) {
      res.status(401).json({ message: "Invalid input" });
    }
  });

  app.patch(api.stage.update.path, async (req, res) => {
    try {
      const input = api.stage.update.input.parse(req.body);
      const currentPassword = await storage.getHostPassword();
      if (!currentPassword || input.password !== currentPassword) {
        return res.status(401).json({ message: "Invalid password" });
      }
      const { password, ...updates } = input;
      const stage = await storage.updateStage(updates);
      if (!stage) {
        return res.status(401).json({ message: "No active stage" });
      }
      await broadcastStateUpdate();
      res.json(stage);
    } catch (e: any) {
      res.status(401).json({ message: "Invalid input" });
    }
  });

  app.delete(api.stage.end.path, async (req, res) => {
    await storage.endStage();
    broadcastStateUpdate();
    res.json({ success: true });
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" }
  });

  async function pushSystemMessage(text: string) {
    const msg = await storage.addMessage({
      id: randomUUID(),
      username: "System",
      text,
      timestamp: Date.now(),
      kind: "system",
      upvotes: 0,
    });
    io.emit("chatMessage", msg);
  }

  async function broadcastStateUpdate() {
    const stage = await storage.getStage();
    const users = await storage.getAllUsers();
    io.emit("stateUpdate", { stage, users });
  }

  io.on("connection", (socket) => {
    let userId: string | null = null;
    let isAdmin = false;

    socket.on("adminLogin", async ({ password }, callback) => {
      try {
        const current = await storage.getHostPassword();
        if (current && password === current) {
          isAdmin = true;
          if (typeof callback === "function") {
            callback({ success: true });
          }
        } else {
          if (typeof callback === "function") {
            callback({ success: false });
          }
        }
      } catch {
        if (typeof callback === "function") {
          callback({ success: false });
        }
      }
    });

    socket.on("joinStage", async (data) => {
      try {
        const payload = ws.send.joinStage.parse(data);
        let user = await storage.getUserByUsername(payload.username);
        
        if (user) {
          await storage.removeUser(user.id);
          user.id = socket.id; // Update to new socket ID
          await storage.addUser(user);
        } else {
          const isHostUser = payload.username === HOST_USERNAME;
          user = await storage.addUser({
            id: socket.id,
            username: payload.username,
            isSpeaker: isHostUser,
            micOn: false,
            cameraOn: false,
            handRaised: false,
            isBanned: false,
            chatMuted: false,
          });
        }
        userId = user.id;
        if (user.username === HOST_USERNAME) {
          isAdmin = true;
        }
        socket.join("stage");
        broadcastStateUpdate();
      } catch (err) {
        console.error("joinStage error", err);
      }
    });

    socket.on("disconnect", async () => {
      if (userId && !isAdmin) {
        await storage.removeUser(userId);
        broadcastStateUpdate();
      }
    });

    socket.on("chatMessage", async (data) => {
      if (!userId && !isAdmin) return;
      
      const user = userId ? await storage.getUser(userId) : null;
      const stage = await storage.getStage();

      // Enforce chat mute / global lock for non-admins
      if (!isAdmin) {
        if (user && user.chatMuted) return;
        if (stage && stage.chatLocked) return;
      }

      try {
        const payload = ws.send.chatMessage.parse(data);

        // Admin slash-commands
        if (isAdmin && payload.text.startsWith("/")) {
          const [rawCommand, ...rest] = payload.text.slice(1).trim().split(/\s+/);
          const command = rawCommand.toLowerCase();
          const arg = rest[0]?.toLowerCase();

          switch (command) {
            case "lock":
              if (stage) {
                await storage.updateStage({ chatLocked: true });
                await broadcastStateUpdate();
                await pushSystemMessage("Chat has been locked by staff.");
              }
              break;
            case "unlock":
              if (stage) {
                await storage.updateStage({ chatLocked: false });
                await broadcastStateUpdate();
                await pushSystemMessage("Chat has been unlocked by staff.");
              }
              break;
            case "qna":
              if (stage && arg === "on") {
                await storage.updateStage({ qnaEnabled: true });
                await broadcastStateUpdate();
                await pushSystemMessage("Q&A mode is now ON. Audience can submit questions and upvote them.");
              } else if (stage && arg === "off") {
                await storage.updateStage({ qnaEnabled: false, pinnedQuestionId: null });
                await broadcastStateUpdate();
                await pushSystemMessage("Q&A mode is now OFF.");
              }
              break;
            case "start_vote": {
              if (stage) {
                const restText = rest.join(" ");
                const rawOptions = restText
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);

                if (rawOptions.length < 2) {
                  await pushSystemMessage(
                    "Usage: /start_vote Option1, Option2, Option3 (need at least 2 options)."
                  );
                  break;
                }

                const poll = {
                  id: randomUUID(),
                  options: rawOptions.map((label) => ({
                    id: randomUUID(),
                    label,
                    votes: 0,
                  })),
                };

                await storage.updateStage({ activePoll: poll });
                await broadcastStateUpdate();
                await pushSystemMessage(
                  `New poll started: ${rawOptions.join(" / ")}`
                );
              }
              break;
            }
            case "end_vote":
              if (stage && stage.activePoll) {
                await storage.updateStage({ activePoll: null });
                await broadcastStateUpdate();
                await pushSystemMessage("Poll ended.");
              }
              break;
            case "help":
              await pushSystemMessage(
                "Chat commands: /lock, /unlock, /qna on, /qna off, /start_vote <opt1, opt2,...>, /end_vote, /help"
              );
              break;
          }

          return;
        }

        const kind = payload.kind ?? "chat";

        const msg = await storage.addMessage({
          id: randomUUID(),
          username: isAdmin ? "Admin" : (user?.username || "Unknown"),
          text: payload.text,
          timestamp: Date.now(),
          kind,
          upvotes: 0,
        });
        io.emit("chatMessage", msg);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("raiseHand", async (data) => {
      if (!userId) return;
      try {
        const payload = ws.send.raiseHand.parse(data);
        await storage.updateUser(userId, { handRaised: payload.state });
        broadcastStateUpdate();
      } catch (err) {}
    });

    socket.on("toggleMedia", async (data) => {
      if (!userId) return;
      try {
        const payload = ws.send.toggleMedia.parse(data);
        const updates: any = {};
        if (payload.type === "mic") updates.micOn = payload.state;
        if (payload.type === "camera") updates.cameraOn = payload.state;
        await storage.updateUser(userId, updates);
        broadcastStateUpdate();
        io.emit("mediaChanged", { userId, type: payload.type, state: payload.state });
      } catch (err) {}
    });

    socket.on("webrtcOffer", (data) => {
      if (!userId) return;
      try {
        const payload = ws.send.webrtcOffer.parse(data);
        io.to(payload.targetId).emit("webrtcOffer", { sourceId: userId, sdp: payload.sdp });
      } catch (err) {}
    });

    socket.on("webrtcAnswer", (data) => {
      if (!userId) return;
      try {
        const payload = ws.send.webrtcAnswer.parse(data);
        io.to(payload.targetId).emit("webrtcAnswer", { sourceId: userId, sdp: payload.sdp });
      } catch (err) {}
    });

    socket.on("webrtcIceCandidate", (data) => {
      if (!userId) return;
      try {
        const payload = ws.send.webrtcIceCandidate.parse(data);
        io.to(payload.targetId).emit("webrtcIceCandidate", { sourceId: userId, candidate: payload.candidate });
      } catch (err) {}
    });

    socket.on("adminAction", async (data) => {
      if (!isAdmin) return;
      try {
        const payload = ws.send.adminAction.parse(data);
        const targetId = payload.targetId;

        if (!targetId) return;

        const user = await storage.getUser(targetId);
        if (!user) return;

        switch (payload.action) {
          case "approveHand":
            await storage.updateUser(targetId, { isSpeaker: true, handRaised: false });
            io.to(targetId).emit("invitedToSpeak", {});
            break;
          case "rejectHand":
            await storage.updateUser(targetId, { handRaised: false });
            break;
          case "removeSpeaker":
            await storage.updateUser(targetId, { isSpeaker: false, micOn: false, cameraOn: false });
            break;
          case "kickUser":
            await storage.updateUser(targetId, { isBanned: true });
            io.to(targetId).emit("kicked", { reason: "Kicked by Admin" });
            await storage.removeUser(targetId);
            break;
          case "muteChat":
            await storage.updateUser(targetId, { chatMuted: !user.chatMuted });
            break;
          case "muteMic":
            await storage.updateUser(targetId, { micOn: false });
            io.emit("mediaChanged", { userId: targetId, type: 'mic', state: false });
            break;
          case "disableCamera":
            await storage.updateUser(targetId, { cameraOn: false });
            io.emit("mediaChanged", { userId: targetId, type: 'camera', state: false });
            break;
          case "inviteToStage":
            await storage.updateUser(targetId, { isSpeaker: true });
            io.to(targetId).emit("invitedToSpeak", {});
            break;
        }
        broadcastStateUpdate();
      } catch (err) {}
    });

    socket.on("voteQuestion", async (data) => {
      if (!userId && !isAdmin) return;
      try {
        const payload = ws.send.voteQuestion.parse(data);
        const existing = await storage.getMessage(payload.messageId);
        if (!existing || existing.kind !== "question") return;

        const updated = await storage.updateMessage(payload.messageId, {
          upvotes: (existing.upvotes || 0) + 1,
        });
        if (updated) {
          io.emit("questionUpdated", updated);
        }
      } catch (err) {
        console.error("voteQuestion error", err);
      }
    });

    socket.on("pinQuestion", async (data) => {
      if (!isAdmin) return;
      try {
        const payload = ws.send.pinQuestion.parse(data);
        const msg = await storage.getMessage(payload.messageId);
        const stage = await storage.getStage();
        if (!msg || msg.kind !== "question" || !stage) return;

        await storage.updateStage({ pinnedQuestionId: payload.messageId });
        await broadcastStateUpdate();
        await pushSystemMessage(`Pinned question: "${msg.text}"`);
      } catch (err) {
        console.error("pinQuestion error", err);
      }
    });

    socket.on("votePoll", async (data) => {
      if (!userId && !isAdmin) return;
      try {
        const payload = ws.send.votePoll.parse(data);
        const stage = await storage.getStage();
        if (!stage || !stage.activePoll) return;

        const poll = stage.activePoll;
        const options = poll.options.map((opt) =>
          opt.id === payload.optionId
            ? { ...opt, votes: (opt.votes || 0) + 1 }
            : opt
        );

        await storage.updateStage({
          activePoll: { ...poll, options },
        });
        await broadcastStateUpdate();
      } catch (err) {
        console.error("votePoll error", err);
      }
    });
  });

  return httpServer;
}
