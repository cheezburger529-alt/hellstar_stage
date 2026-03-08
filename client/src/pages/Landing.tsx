import React, { useState, useEffect } from 'react';
import { useJoinStage, useStageData } from '@/hooks/use-api';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function Landing() {
  const [username, setUsername] = useState('');
  const joinMutation = useJoinStage();
  const [, setLocation] = useLocation();
  const { data: stage, isLoading } = useStageData();
  const { toast } = useToast();

  // Auto-login if localstorage has username
  useEffect(() => {
    const saved = localStorage.getItem('stage_username');
    if (saved && stage && !joinMutation.isPending) {
      joinMutation.mutate(saved, {
        onSuccess: () => setLocation('/stage'),
        onError: () => localStorage.removeItem('stage_username')
      });
    }
  }, [stage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.startsWith('@')) {
      toast({
        title: "Invalid Username",
        description: "Username must start with '@'",
        variant: "destructive"
      });
      return;
    }

    joinMutation.mutate(username, {
      onSuccess: () => setLocation('/stage'),
      onError: (err) => {
        toast({ title: "Failed to join", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading || joinMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Live Stage</h1>
          <p className="text-muted-foreground">
            {stage ? `Join "${stage.name}" right now.` : "No active stage. Wait for admin to start."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Choose Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@johndoe"
              disabled={!stage}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
            />
          </div>
          
          <button
            type="submit"
            disabled={!stage || joinMutation.isPending || !username}
            className="w-full py-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed primary-glow"
          >
            {joinMutation.isPending ? "Joining..." : "Enter Stage"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a href="/admin" className="text-xs text-muted-foreground hover:text-white transition-colors">
            Admin Login
          </a>
        </div>
      </motion.div>
    </div>
  );
}
