import React, { useState } from 'react';
import { useAdminLogin, useCreateStage, useStageData } from '@/hooks/use-api';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';

export default function Admin() {
  const { isAdmin } = useStore();
  const [password, setPassword] = useState('');
  const [stageName, setStageName] = useState('');
  const [desc, setDesc] = useState('');
  
  const loginMutation = useAdminLogin();
  const createMutation = useCreateStage();
  const { data: stage } = useStageData();
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(password);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name: stageName, description: desc }, {
      onSuccess: () => setLocation('/')
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Decorative bg */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10"
      >
        <h1 className="font-display font-bold text-2xl text-white mb-6">
          Stage Control Panel
        </h1>

        {!isAdmin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors"
            >
              {loginMutation.isPending ? "Verifying..." : "Access Controls"}
            </button>
            {loginMutation.isError && (
              <p className="text-red-400 text-sm text-center">Invalid password</p>
            )}
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            {stage && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-6 text-green-400 text-sm">
                Stage "{stage.name}" is currently active. Creating a new one will override it.
              </div>
            )}
            <div>
              <label className="block text-sm text-white/70 mb-2">Stage Name</label>
              <input
                type="text"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Topic / Description</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                required
                rows={3}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 primary-glow transition-all"
            >
              {createMutation.isPending ? "Creating..." : "Launch Stage & Open Lobby"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
