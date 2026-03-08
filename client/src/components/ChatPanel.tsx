import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getSocket } from '@/hooks/use-socket';
import { Send, MessageSquareOff, ArrowBigUp, Pin, SmilePlus, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import EmojiPicker, { Theme } from 'emoji-picker-react';

export function ChatPanel() {
  const { messages, currentUser, stage, isAdmin } = useStore();
  const socket = getSocket();
  const [input, setInput] = useState('');
  const [inputMode, setInputMode] = useState<'chat' | 'question'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ADMIN_COMMANDS = [
    { command: '/kick', description: 'Kick a user from the stage' },
    { command: '/mute', description: 'Mute a user in chat' },
    { command: '/clear', description: 'Clear the chat history' },
    { command: '/ban', description: 'Ban a user from the stage' },
    { command: '/stage', description: 'Manage stage settings' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || currentUser?.chatMuted) return;

    if (isAdmin && input.startsWith('/')) {
      socket.emit('adminCommand', { command: input });
      setInput('');
      return;
    }

    const kind = stage?.qnaEnabled && inputMode === 'question' ? 'question' : 'chat';
    socket.emit('chatMessage', { text: input, kind });
    setInput('');
  };

  const handleVote = (id: string) => {
    socket.emit('voteQuestion', { messageId: id });
  };

  const handlePin = (id: string) => {
    socket.emit('pinQuestion', { messageId: id });
  };

  const showCommands = isAdmin && input.startsWith('/');
  const filteredCommands = showCommands 
    ? ADMIN_COMMANDS.filter(c => c.command.toLowerCase().startsWith(input.split(' ')[0].toLowerCase())) 
    : [];

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-md rounded-2xl border border-white/5">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-semibold text-white">Live Chat</h3>
            {stage?.qnaEnabled && (
              <p className="text-[11px] text-primary/80 mt-0.5">
                Q&amp;A mode is ON – audience can submit questions and upvote them.
              </p>
            )}
          </div>
          {stage?.qnaEnabled && (
            <div className="inline-flex rounded-full bg-white/5 p-1 text-xs">
              <button
                type="button"
                onClick={() => setInputMode('chat')}
                className={`px-2 py-0.5 rounded-full ${
                  inputMode === 'chat' ? 'bg-white text-black' : 'text-muted-foreground'
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setInputMode('question')}
                className={`px-2 py-0.5 rounded-full ${
                  inputMode === 'question' ? 'bg-primary text-white' : 'text-muted-foreground'
                }`}
              >
                Question
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hidden" ref={scrollRef}>
        {stage?.activePoll && (
          <div className="mb-2 rounded-2xl border border-primary/40 bg-primary/10 p-3 text-xs text-white/90 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[11px] uppercase tracking-wide text-primary/80">
                Live poll
              </span>
              {stage.activePoll.endsAt && (
                <span className="text-[10px] text-primary/70">
                  Ends soon
                </span>
              )}
            </div>
            {(() => {
              const totalVotes = stage.activePoll.options.reduce(
                (sum, o) => sum + (o.votes || 0),
                0
              );
              return (
                <div className="flex flex-col gap-1">
                  {stage.activePoll.options.map((opt) => {
                    const votes = opt.votes || 0;
                    const percent =
                      totalVotes > 0
                        ? Math.round((votes / totalVotes) * 100)
                        : 0;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => socket.emit('votePoll', { optionId: opt.id })}
                        className="flex items-center justify-between gap-2 rounded-xl bg-black/30 hover:bg-black/50 px-3 py-1.5 text-left transition-colors"
                      >
                        <span>{opt.label}</span>
                        <span className="text-[11px] text-primary-foreground/80 bg-black/40 rounded-full px-2 py-0.5">
                          {percent}% / {votes} vote{votes === 1 ? '' : 's'}
                        </span>
                      </button>
                    );
                  })}
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    Total votes: {totalVotes}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.username === currentUser?.username;
            const isSystem = msg.kind === 'system';
            const isQuestion = msg.kind === 'question';

            if (isSystem) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <div className="text-[11px] text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full">
                    {msg.text}
                  </div>
                </motion.div>
              );
            }

            const reactions = msg.reactions || [];

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-xs text-muted-foreground mb-1 px-1 flex items-center gap-1">
                  <span>{msg.username}</span>
                  {isQuestion && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px]">
                      Question
                    </span>
                  )}
                </span>
                <div className="relative">
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-[280px] sm:max-w-[320px] text-sm space-y-2 ${
                      isMe
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-white/10 text-white rounded-bl-none'
                    }`}
                  >
                    <div className="break-words">{msg.text}</div>
                    {isQuestion && (
                      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <button
                          type="button"
                          onClick={() => handleVote(msg.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                        >
                          <ArrowBigUp className="w-3 h-3" />
                          <span>{msg.upvotes ?? 0}</span>
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handlePin(msg.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 hover:bg-black/40 text-amber-200 transition-colors"
                          >
                            <Pin className="w-3 h-3" />
                            <span>Pin to stage</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reactions row */}
                    {reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {reactions.map((r) => {
                          const userIds = r.userIds || [];
                          const count = userIds.length;
                          const hasReacted = currentUser
                            ? userIds.includes(currentUser.id)
                            : false;
                          return (
                            <button
                              key={r.emoji}
                              type="button"
                              onClick={() =>
                                socket.emit('reactMessage', {
                                  messageId: msg.id,
                                  emoji: r.emoji,
                                })
                              }
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] border ${
                                hasReacted
                                  ? 'bg-primary/20 border-primary/30 text-primary-foreground'
                                  : 'bg-black/30 border-transparent hover:border-white/10 text-white/80'
                              } transition-colors`}
                            >
                              <span>{r.emoji}</span>
                              <span>{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Hover Reaction Picker */}
                  {currentUser && (
                    <div className={`absolute top-0 ${isMe ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card border border-white/10 rounded-xl shadow-xl flex items-center`}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="p-2 hover:bg-white/10 rounded-xl text-white/80 transition-colors"
                            title="React"
                          >
                            <SmilePlus className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align={isMe ? 'end' : 'start'} className="w-auto p-0 border-none bg-transparent shadow-none mb-2">
                          <EmojiPicker 
                            theme={Theme.DARK} 
                            reactionsDefaultOpen={true}
                            onEmojiClick={(emojiData) => {
                              socket.emit('reactMessage', {
                                messageId: msg.id,
                                emoji: emojiData.emoji,
                              });
                            }} 
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
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

      <div className="p-4 border-t border-white/10 relative">
        {showCommands && filteredCommands.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-card/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20">
            <div className="p-3 text-xs font-semibold text-muted-foreground border-b border-white/10 bg-black/20 flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              Commands Matching <span className="text-white">{input.split(' ')[0]}</span>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {filteredCommands.map((cmd, idx) => (
                <button
                  key={cmd.command}
                  type="button"
                  className={`w-full text-left px-4 py-3 flex flex-col gap-0.5 transition-colors ${idx === 0 ? 'bg-primary/20' : 'hover:bg-white/5'}`}
                  onClick={() => {
                    setInput(cmd.command + ' ');
                    inputRef.current?.focus();
                  }}
                >
                  <span className="font-mono text-sm text-primary font-medium">{cmd.command}</span>
                  <span className="text-xs text-muted-foreground">{cmd.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentUser?.chatMuted ? (
          <div className="text-center text-red-400 text-sm py-2">
            You have been muted from chat.
          </div>
        ) : (
          <form onSubmit={sendMessage} className="relative flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
                >
                  <SmilePlus className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-auto p-0 border-none bg-transparent shadow-none mb-2">
                <EmojiPicker 
                  theme={Theme.DARK} 
                  onEmojiClick={(emojiData) => setInput((prev) => prev + emojiData.emoji)} 
                />
              </PopoverContent>
            </Popover>

            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  stage?.qnaEnabled && inputMode === 'question'
                    ? 'Ask a question for the stage...'
                    : 'Say something...'
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-muted-foreground transition-all"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white disabled:opacity-0 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
