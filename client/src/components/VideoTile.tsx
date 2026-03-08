import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, User as UserIcon } from 'lucide-react';
import type { User } from '@shared/schema';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface VideoTileProps {
  user: User;
  stream: MediaStream | null;
  isLocal?: boolean;
  className?: string;
}

export function VideoTile({ user, stream, isLocal, className }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Determine if video is active based on state
  const hasVideo = user.cameraOn && stream && stream.getVideoTracks().length > 0;

  return (
    <div className={twMerge(
      "relative rounded-2xl overflow-hidden bg-card border border-white/5 shadow-lg group",
      className
    )}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Never hear yourself
        className={clsx(
          "w-full h-full object-cover transition-opacity duration-300",
          hasVideo ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Fallback Avatar when video is off */}
      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/80 backdrop-blur-sm">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-3">
            <UserIcon className="w-10 h-10 text-primary" />
          </div>
          <span className="font-display font-medium text-lg text-white">
            {user.username}
          </span>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between">
        <div className="flex items-center gap-2">
          {isLocal && (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary text-white rounded-md">
              You
            </span>
          )}
          {hasVideo && (
             <span className="font-medium text-white drop-shadow-md">
               {user.username}
             </span>
          )}
        </div>
        
        {/* Audio Indicator */}
        <div className={clsx(
          "p-2 rounded-full backdrop-blur-md transition-colors",
          user.micOn ? "bg-white/10 text-white" : "bg-red-500/80 text-white"
        )}>
          {user.micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}
