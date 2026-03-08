import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from './use-socket';
import { useStore } from '@/lib/store';
import { ws } from '@shared/routes';
import { useToast } from './use-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useWebRTC() {
  const { currentUser, users } = useStore();
  const socket = getSocket();
  const { toast } = useToast();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  // Expose track toggling functionality
  const toggleTrack = useCallback((kind: 'audio' | 'video', state: boolean) => {
    if (localStreamRef.current) {
      const tracks = kind === 'audio' 
        ? localStreamRef.current.getAudioTracks() 
        : localStreamRef.current.getVideoTracks();
        
      tracks.forEach(t => t.enabled = state);
      
      // Notify others via signaling
      socket.emit('toggleMedia', { type: kind === 'audio' ? 'mic' : 'camera', state });
    }
  }, [socket]);

  // Handle local media initialization when user becomes a speaker
  useEffect(() => {
    if (!currentUser?.isSpeaker) {
      // Stop tracks if we are demoted from speaker
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        
        // Close all peer connections
        Object.values(peersRef.current).forEach(pc => pc.close());
        peersRef.current = {};
        setRemoteStreams({});
      }
      return;
    }

    let mounted = true;

    async function startLocalMedia() {
      if (localStreamRef.current) return; // Already have media
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        // Apply initial state from user object
        stream.getAudioTracks().forEach(t => t.enabled = currentUser!.micOn);
        stream.getVideoTracks().forEach(t => t.enabled = currentUser!.cameraOn);

        localStreamRef.current = stream;
        setLocalStream(stream);

      } catch (err) {
        console.error("Failed to get local media", err);
        toast({
          title: "Camera/Mic Error",
          description: "Could not access media devices. Please check permissions.",
          variant: "destructive"
        });
      }
    }

    startLocalMedia();

    return () => {
      mounted = false;
    };
  }, [currentUser?.isSpeaker, currentUser?.micOn, currentUser?.cameraOn, toast]);

  // WebRTC Mesh logic
  useEffect(() => {
    if (!currentUser || !socket.connected) return;

    const createPeer = (targetId: string, initiator: boolean) => {
      if (peersRef.current[targetId]) return peersRef.current[targetId];

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[targetId] = pc;

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtcIceCandidate', { targetId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams(prev => {
          const currentStream = prev[targetId] || new MediaStream();
          // Avoid adding duplicate tracks
          if (!currentStream.getTracks().find(t => t.id === event.track.id)) {
            currentStream.addTrack(event.track);
          }
          return { ...prev, [targetId]: currentStream };
        });
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[targetId];
            return next;
          });
          delete peersRef.current[targetId];
        }
      };

      if (initiator) {
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit('webrtcOffer', { targetId, sdp: pc.localDescription });
          })
          .catch(err => console.error("Error creating offer", err));
      }

      return pc;
    };

    // Mesh connection initiation
    // Ensure every participant can receive media from all speakers.
    // For each speaker (other than me), whichever of us has the greater ID
    // initiates the connection to avoid crossing offers.
    const targetSpeakers = users.filter(u => u.isSpeaker && u.id !== currentUser.id);
    targetSpeakers.forEach(speaker => {
      if (!peersRef.current[speaker.id] && currentUser.id > speaker.id) {
        createPeer(speaker.id, true);
      }
    });

    // Cleanup disconnected peers
    const currentSpeakerIds = new Set(users.filter(u => u.isSpeaker).map(u => u.id));
    Object.keys(peersRef.current).forEach(peerId => {
      if (!currentSpeakerIds.has(peerId)) {
        peersRef.current[peerId].close();
        delete peersRef.current[peerId];
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      }
    });

    // Socket Event Handlers for WebRTC
    const onOffer = async (data: unknown) => {
      const parsed = ws.receive.webrtcOffer.safeParse(data);
      if (!parsed.success) return;
      const { sourceId, sdp } = parsed.data;
      
      const pc = createPeer(sourceId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtcAnswer', { targetId: sourceId, sdp: pc.localDescription });
    };

    const onAnswer = async (data: unknown) => {
      const parsed = ws.receive.webrtcAnswer.safeParse(data);
      if (!parsed.success) return;
      const { sourceId, sdp } = parsed.data;
      
      const pc = peersRef.current[sourceId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp)).catch(console.error);
      }
    };

    const onCandidate = async (data: unknown) => {
      const parsed = ws.receive.webrtcIceCandidate.safeParse(data);
      if (!parsed.success) return;
      const { sourceId, candidate } = parsed.data;
      
      const pc = peersRef.current[sourceId];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      }
    };

    socket.on('webrtcOffer', onOffer);
    socket.on('webrtcAnswer', onAnswer);
    socket.on('webrtcIceCandidate', onCandidate);

    return () => {
      socket.off('webrtcOffer', onOffer);
      socket.off('webrtcAnswer', onAnswer);
      socket.off('webrtcIceCandidate', onCandidate);
    };
  }, [currentUser, users, socket]);

  return {
    localStream,
    remoteStreams,
    toggleTrack
  };
}
