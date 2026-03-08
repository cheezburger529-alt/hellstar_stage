import React, { useState } from 'react';
import { useAdminLogin, useCreateStage, useStageData, useUpdateStage } from '@/hooks/use-api';
import { useStore } from '@/lib/store';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';

export default function Admin() {
  const { isAdmin } = useStore();
  const [password, setPassword] = useState('');
  const [stageName, setStageName] = useState('');
  const [desc, setDesc] = useState('');
  const [hostPassword, setHostPassword] = useState<string | null>(null);
  const [hostUsername, setHostUsername] = useState<string | null>(null);
  
  const loginMutation = useAdminLogin();
  const createMutation = useCreateStage();
  const updateMutation = useUpdateStage();
  const { data: stage } = useStageData();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    const stored = localStorage.getItem('stage_host_password');
    if (stored) {
      setHostPassword(stored);
    }
    // Host username is fixed for now
    setHostUsername("@Host_Account_9148");
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(password);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name: stageName, description: desc }, {
      onSuccess: (data) => {
        setHostPassword(data.hostPassword);
        setHostUsername(data.hostUsername);
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      { name: stageName || stage?.name, description: desc || stage?.description || '' },
      {
        onSuccess: () => {
          // No redirect; just rely on live update
        },
      }
    );
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
          <>
            {stage && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-6 text-green-400 text-sm space-y-2">
                <div>Stage "{stage.name}" is currently active.</div>
                <div className="text-xs text-green-200/80">
                  Edit the title/description below. You can still create a brand new stage if you want to reset everything.
                </div>
              </div>
            )}

            {hostPassword && hostUsername && (
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 space-y-2">
                <div className="font-semibold">Host Account</div>
                <div className="flex items-center justify-between">
                  <span>Username:</span>
                  <code className="px-2 py-1 rounded bg-black/60 text-xs">{hostUsername}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Password:</span>
                  <code className="px-2 py-1 rounded bg-black/60 text-xs break-all">{hostPassword}</code>
                </div>
                <p className="text-[10px] text-white/60 mt-2">
                  Use this on the main join screen via "I am the host" to control the live stage.
                </p>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-white/70 mb-2">Edit Stage Title</label>
                <input
                  type="text"
                  value={stageName || stage?.name || ''}
                  onChange={(e) => setStageName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Edit Topic / Description</label>
                <textarea
                  value={desc || stage?.description || ''}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </form>

            <form onSubmit={handleCreate} className="space-y-4 border-t border-white/10 pt-4 mt-4">
              <div className="text-xs text-muted-foreground mb-1">
                Or create a brand new stage (this resets the current one and generates a new host password).
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">New Stage Name</label>
                <input
                  type="text"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">New Topic / Description</label>
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
                {createMutation.isPending ? "Creating..." : "Launch New Stage"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
