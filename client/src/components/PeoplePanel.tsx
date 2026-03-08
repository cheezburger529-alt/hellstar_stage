import React from 'react';
import { useStore } from '@/lib/store';
import { getSocket } from '@/hooks/use-socket';
import { UserMinus, MicOff, VideoOff, Hand, HandHeart, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export function PeoplePanel() {
  const { users, isAdmin, currentUser } = useStore();
  const socket = getSocket();

  const speakers = users.filter(u => u.isSpeaker);
  const audience = users.filter(u => !u.isSpeaker && !u.handRaised);
  const requests = users.filter(u => !u.isSpeaker && u.handRaised);

  const adminAction = (action: string, targetId: string) => {
    socket.emit('adminAction', { action, targetId });
  };

  const UserRow = ({ user, type }: { user: any, type: 'speaker'|'audience'|'request' }) => (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs">
          {user.username.substring(1, 3).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">{user.username}</span>
          {user.id === currentUser?.id && <span className="text-[10px] text-primary">You</span>}
        </div>
      </div>
      
      {isAdmin && user.id !== currentUser?.id && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {type === 'request' && (
            <>
              <button onClick={() => adminAction('approveHand', user.id)} className="p-1.5 text-green-400 hover:bg-green-400/20 rounded-md">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => adminAction('rejectHand', user.id)} className="p-1.5 text-red-400 hover:bg-red-400/20 rounded-md">
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          
          {type === 'audience' && (
            <button onClick={() => adminAction('inviteToStage', user.id)} className="p-1.5 text-primary hover:bg-primary/20 rounded-md" title="Invite to Stage">
              <HandHeart className="w-4 h-4" />
            </button>
          )}

          {type === 'speaker' && (
            <>
              <button onClick={() => adminAction('muteMic', user.id)} className="p-1.5 text-yellow-400 hover:bg-yellow-400/20 rounded-md" title="Mute Mic">
                <MicOff className="w-4 h-4" />
              </button>
              <button onClick={() => adminAction('removeSpeaker', user.id)} className="p-1.5 text-red-400 hover:bg-red-400/20 rounded-md" title="Remove from Stage">
                <UserMinus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-y-auto scrollbar-hidden p-4 space-y-6">
      
      {requests.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Hand className="w-3 h-3" /> Requests ({requests.length})
          </h4>
          <div className="space-y-1">
            {requests.map(u => <UserRow key={u.id} user={u} type="request" />)}
          </div>
        </motion.div>
      )}

      <div>
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Speakers ({speakers.length})
        </h4>
        <div className="space-y-1">
          {speakers.map(u => <UserRow key={u.id} user={u} type="speaker" />)}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Audience ({audience.length})
        </h4>
        <div className="space-y-1">
          {audience.map(u => <UserRow key={u.id} user={u} type="audience" />)}
          {audience.length === 0 && (
            <p className="text-sm text-muted-foreground italic px-2">No one here yet.</p>
          )}
        </div>
      </div>

    </div>
  );
}
