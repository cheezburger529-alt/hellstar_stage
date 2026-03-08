## Packages
socket.io-client | Real-time signaling, chat, and state synchronization
framer-motion | Fluid animations and page transitions
zustand | Simplified global state management for complex real-time WebRTC/Socket state
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility to merge tailwind classes safely

## Notes
- WebRTC implementation relies on `socket.io-client` for signaling (offers, answers, ICE candidates).
- Uses `navigator.mediaDevices.getUserMedia` for camera/mic access; requires running on localhost or HTTPS.
- Mute/Camera off functionality toggles the `enabled` state of local media tracks rather than destroying them, to maintain stable peer connections.
- Backend socket is expected to relay events to specific clients (e.g., `webrtcOffer` mapped to a target).
