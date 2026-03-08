import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { useSocketConnection, getSocket } from '@/hooks/use-socket';
import { useWebRTC } from '@/hooks/use-webrtc';
import { VideoTile } from '@/components/VideoTile';
import { ChatPanel } from '@/components/ChatPanel';
import { PeoplePanel } from '@/components/PeoplePanel';
import { Mic, MicOff, Video, VideoOff, Hand, HandHeart, LogOut, Users, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Stage() {
  const { currentUser, stage, users, setCurrentUser, messages } = useStore();
  const socket = getSocket();
  const { isConnected } = useSocketConnection();
  const { localStream, remoteStreams, toggleTrack } = useWebRTC();
  
  const [activeTab, setActiveTab] = useState<'chat' | 'people'>('chat');

  const pinnedQuestion = stage?.pinnedQuestionId
    ? messages.find((m) => m.id === stage.pinnedQuestionId)
    : null;

  if (!stage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const speakers = users.filter(u => u.isSpeaker);
  
  const handleLeave = () => {
    socket.disconnect();
    setCurrentUser(null);
    localStorage.removeItem('stage_username');
  };

  const toggleHand = () => {
    if (!currentUser) return;
    socket.emit('raiseHand', { state: !currentUser.handRaised });
  };

  const toggleMic = () => {
    if (!currentUser) return;
    toggleTrack('audio', !currentUser.micOn);
  };

  const toggleCam = () => {
    if (!currentUser) return;
    toggleTrack('video', !currentUser.cameraOn);
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row p-2 md:p-4 gap-4 bg-background">
      
      {/* Main Stage Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex flex-col gap-3 px-6 py-4 glass-panel rounded-2xl mb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-xl md:text-2xl text-white">
                {stage.name}
              </h1>
              <p className="text-sm text-muted-foreground">{stage.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-muted-foreground">{users.length} watching</span>
              </div>
              <button 
                onClick={handleLeave}
                className="p-2 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
          {pinnedQuestion && (
            <div className="px-3 py-2 rounded-2xl bg-primary/10 border border-primary/40 text-sm text-white/90 flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-primary/80">
                Pinned question
              </span>
              <span>{pinnedQuestion.text}</span>
            </div>
          )}
        </header>

        {/* Video Grid */}
        <div className="flex-1 relative rounded-3xl overflow-hidden glass-panel flex flex-col p-4">
          {speakers.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <MicOff className="w-8 h-8 opacity-50" />
              </div>
              <h2 className="font-display text-xl text-white mb-2">Stage is waiting</h2>
              <p>No speakers have joined the stage yet.</p>
            </div>
          ) : (
            <div className={`grid gap-4 w-full h-full ${
              speakers.length === 1 ? 'grid-cols-1' :
              speakers.length <= 4 ? 'grid-cols-2' :
              speakers.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'
            }`}>
              {speakers.map(speaker => {
                const isMe = speaker.id === currentUser?.id;
                const stream = isMe ? localStream : remoteStreams[speaker.id];
                return (
                  <VideoTile 
                    key={speaker.id} 
                    user={speaker} 
                    stream={stream || null}
                    isLocal={isMe} 
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="mt-4 flex justify-center">
          <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-4">
            {currentUser?.isSpeaker ? (
              <>
                <button 
                  onClick={toggleMic}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    currentUser.micOn 
                      ? 'bg-white/10 hover:bg-white/20 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                  }`}
                >
                  {currentUser.micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button 
                  onClick={toggleCam}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    currentUser.cameraOn 
                      ? 'bg-white/10 hover:bg-white/20 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                  }`}
                >
                  {currentUser.cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <button 
                onClick={toggleHand}
                className={`px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${
                  currentUser?.handRaised 
                    ? 'bg-primary text-white primary-glow' 
                    : 'glass-button'
                }`}
              >
                {currentUser?.handRaised ? (
                  <><HandHeart className="w-5 h-5" /> Request Sent</>
                ) : (
                  <><Hand className="w-5 h-5" /> Raise Hand</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        {/* Tab Switcher */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex justify-center items-center gap-2 transition-all ${
              activeTab === 'chat' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
          <button 
            onClick={() => setActiveTab('people')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex justify-center items-center gap-2 transition-all ${
              activeTab === 'people' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> People
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0">
          {activeTab === 'chat' ? <ChatPanel /> : <PeoplePanel />}
        </div>
      </div>

    </div>
  );
}
