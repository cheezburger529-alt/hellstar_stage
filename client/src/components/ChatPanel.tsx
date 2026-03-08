import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getSocket } from '@/hooks/use-socket';
import { Send, MessageSquareOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatPanel() {
  const { messages, currentUser } = useStore();
  const socket = getSocket();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || currentUser?.chatMuted) return;
    
    socket.emit('chatMessage', { text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-md rounded-2xl border border-white/5">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-display font-semibold text-white">Live Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hidden" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.username === currentUser?.username;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-xs text-muted-foreground mb-1 px-1">
                  {msg.username}
                </span>
                <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                  isMe 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-white/10 text-white rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <MessageSquareOff className="w-12 h-12 mb-2" />
            <p>No messages yet</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10">
        {currentUser?.chatMuted ? (
          <div className="text-center text-red-400 text-sm py-2">
            You have been muted from chat.
          </div>
        ) : (
          <form onSubmit={sendMessage} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Say something..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-muted-foreground"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
