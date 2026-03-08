# Live Stage Platform

A modern, real-time live streaming stage platform built with React, WebRTC, and Socket.io. Perfect for virtual events, conferences, and live discussions.

## Features

- **No Signup Required**: Users join with a unique `@username`
- **Real-Time Video/Audio**: WebRTC mesh network for peer-to-peer streaming
- **Speaker Management**: Audience members can raise their hand to speak
- **Live Chat**: Real-time messaging with all participants
- **Admin Controls**: Admin can approve speakers, manage users, mute chats, and more
- **Dark Modern UI**: Beautiful, minimal dark interface
- **Mobile Friendly**: Fully responsive design for all devices

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, Socket.io
- **Real-Time**: WebRTC for P2P video/audio, Socket.io for signaling
- **State**: Zustand (frontend), In-memory storage (backend)

## Getting Started Locally

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/live-stage-platform.git
cd live-stage-platform
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open [http://localhost:5000](http://localhost:5000) in your browser

## Deployment

### Deploy to Render

1. **Create a Render account** at https://render.com

2. **Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

3. **Create a new Web Service on Render**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Set the build command: `npm install && npm run build`
   - Set the start command: `npm run start`
   - Add environment variables from `.env.example`

4. **Deploy**
   - Render will automatically deploy when you push to GitHub

### Deploy to Cloudflare Pages (Frontend) + Backend elsewhere

For this approach, you'll need to host the backend separately (on Render, Railway, etc.) and use Cloudflare Pages for static content.

Alternatively, use Cloudflare Workers with a Node.js adapter (more complex setup).

## Admin Access

To access the admin panel:
1. Go to the `/admin` route
2. Enter the admin password: `GG_/(())_ROCKSTAR`
3. Create a stage and manage speakers

## Environment Variables

See `.env.example` for required variables:
- `NODE_ENV`: Set to `production` for deployment
- `PORT`: Server port (default: 5000)
- `SESSION_SECRET`: Secret key for session management

## Project Structure

```
live-stage-platform/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   ├── hooks/      # Custom React hooks
│   │   └── lib/        # Utilities and state
│   └── index.html
├── server/              # Express backend
│   ├── index.ts        # Server entry point
│   ├── routes.ts       # API routes
│   ├── storage.ts      # Data storage layer
│   └── vite.ts         # Vite dev server setup
├── shared/              # Shared types and schemas
│   ├── schema.ts       # Data models
│   └── routes.ts       # API contract
└── package.json
```

## Development

### Build for Production
```bash
npm run build
```

### Type Check
```bash
npm run check
```

## Browser Support

- Chrome/Chromium 60+
- Firefox 55+
- Safari 14+
- Edge 79+

**Note**: WebRTC requires HTTPS in production or localhost in development.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
