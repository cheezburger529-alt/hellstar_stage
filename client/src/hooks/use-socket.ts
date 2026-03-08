import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '@/lib/store';
import { ws } from '@shared/routes';
import { useToast } from './use-toast';

// Create a singleton socket instance but don't connect immediately
let socketInstance: Socket | null = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io('/', { autoConnect: false });
  }
  return socketInstance;
};

export function useSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const { currentUser, setStage, setUsers, addMessage, updateMessage, setCurrentUser, setIsAdmin } = useStore();
  const { toast } = useToast();
  
  const socket = getSocket();

  useEffect(() => {
    if (!currentUser) {
      if (socket.connected) socket.disconnect();
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      setIsConnected(true);
      // Re-join stage automatically on reconnect
      socket.emit('joinStage', { username: currentUser.username });

      const hostPassword = localStorage.getItem('stage_host_password');
      if (hostPassword) {
        socket.emit('adminLogin', { password: hostPassword }, (resp: any) => {
          if (resp && resp.success) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            localStorage.removeItem('stage_host_password');
          }
        });
      } else {
        setIsAdmin(false);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setIsAdmin(false);
    };

    const onStateUpdate = (data: unknown) => {
      const parsed = ws.receive.stateUpdate.safeParse(data);
      if (parsed.success) {
        setStage(parsed.data.stage);
        setUsers(parsed.data.users);
        
        // Update current user state if changed
        const me = parsed.data.users.find(u => u.id === currentUser.id || u.username === currentUser.username);
        if (me && JSON.stringify(me) !== JSON.stringify(currentUser)) {
          setCurrentUser(me);
        }
        if (me?.username === '@Host_Account_9148') {
          setIsAdmin(true);
        }
      }
    };

    const onChatMessage = (data: unknown) => {
      const parsed = ws.receive.chatMessage.safeParse(data);
      if (parsed.success) {
        addMessage(parsed.data);
      }
    };

    const onQuestionUpdated = (data: unknown) => {
      const parsed = ws.receive.questionUpdated.safeParse(data);
      if (parsed.success) {
        updateMessage(parsed.data);
      }
    };

    const onMessageUpdated = (data: unknown) => {
      const parsed = ws.receive.messageUpdated.safeParse(data);
      if (parsed.success) {
        updateMessage(parsed.data);
      }
    };

    const onKicked = (data: unknown) => {
      const parsed = ws.receive.kicked.safeParse(data);
      if (parsed.success) {
        toast({
          title: "Disconnected",
          description: parsed.data.reason,
          variant: "destructive"
        });
        setCurrentUser(null);
      }
    };

    const onInvited = () => {
      toast({
        title: "Invited to Speak!",
        description: "The admin has invited you to the stage.",
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('stateUpdate', onStateUpdate);
    socket.on('chatMessage', onChatMessage);
    socket.on('questionUpdated', onQuestionUpdated);
    socket.on('messageUpdated', onMessageUpdated);
    socket.on('kicked', onKicked);
    socket.on('invitedToSpeak', onInvited);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('stateUpdate', onStateUpdate);
      socket.off('chatMessage', onChatMessage);
      socket.off('questionUpdated', onQuestionUpdated);
      socket.off('messageUpdated', onMessageUpdated);
      socket.off('kicked', onKicked);
      socket.off('invitedToSpeak', onInvited);
    };
  }, [currentUser, setStage, setUsers, addMessage, updateMessage, setCurrentUser, toast, socket]);

  return { socket, isConnected };
}
