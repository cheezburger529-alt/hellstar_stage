import React, { useState, useEffect } from 'react';
import { useJoinStage, useStageData, useHostLogin } from '@/hooks/use-api';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function Landing() {
  const [username, setUsername] = useState('');
  const [isHostMode, setIsHostMode] = useState(false);
  const [hostPassword, setHostPassword] = useState('');
  const joinMutation = useJoinStage();
  const hostLoginMutation = useHostLogin();
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

    if (isHostMode) {
      if (!hostPassword) {
        toast({
          title: "Host Password Required",
          description: "Enter the host password from the admin panel.",
          variant: "destructive"
        });
        return;
      }

      const HOST_USERNAME = "@Host_Account_9148";

      hostLoginMutation.mutate(hostPassword, {
        onSuccess: () => {
          joinMutation.mutate(HOST_USERNAME, {
            onSuccess: () => setLocation('/stage'),
            onError: (err) => {
              toast({ title: "Failed to join", description: err.message, variant: "destructive" });
            }
          });
        },
        onError: (err) => {
          toast({ title: "Host Login Failed", description: err.message, variant: "destructive" });
        }
      });
    } else {
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
    }
  };

  if (isLoading || joinMutation.isPending || hostLoginMutation.isPending) {
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
            {stage ? `Join "${stage.name}" right now.` : "No active stage. Wait for host to start."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isHostMode ? (
            <>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Choose Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@johndoe"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              
              <button
                type="submit"
                disabled={!stage || joinMutation.isPending || !username}
                className="w-full py-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed primary-glow"
              >
                {joinMutation.isPending ? "Joining..." : "Enter Stage"}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Host Password</label>
                <input
                  type="password"
                  value={hostPassword}
                  onChange={(e) => setHostPassword(e.target.value)}
                  placeholder="Paste password from admin panel"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!stage || hostLoginMutation.isPending || !hostPassword}
                className="w-full py-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed primary-glow"
              >
                {hostLoginMutation.isPending ? "Signing in as Host..." : "Enter as Host"}
              </button>
            </>
          )}
        </form>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setIsHostMode((v) => !v)}
            className="hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            {isHostMode ? "Join as regular listener" : "I am the host"}
          </button>
          <div className="mt-3">
            <a href="/admin" className="hover:text-white transition-colors">
              Admin Panel
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
