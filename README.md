<div align="center">
  <img src="https://i.ibb.co/1QQtRyN/confident-ai-logo-green-grey.png"> 
  <h1>Confidence AI - Live Presentation Coaching</h1>
  <p>
    <strong>Real-time presentation coaching powered by Hume.ai's Empathic Voice Interface and Expression Measurement API!</strong>
  </p>
</div>

## Overview

Confidence AI is a wellness application designed to enhance public speaking abilities through real-time feedback. Built for professionals and students, it analyzes your voice, facial expressions, and body language during presentations, providing instant insights and actionable suggestions for improvement. The project leverages Hume's [Empathic Voice Interface](https://hume.docs.buildwithfern.com/docs/empathic-voice-interface-evi/overview) and Expression Measurement API using their TypeScript SDK.

Try it out: [presentation-coach.vercel.app](https://presentation-coach.vercel.app)

## Prerequisites

Ensure your development environment meets the following requirements:
- [Node.js](https://nodejs.org/en) (`v18.0.0` or higher)
- [pnpm](https://pnpm.io/installation) (`v8.0.0` or higher)

To verify your installations on Mac via terminal:

```bash
# Check Node.js version
node -v

# Check pnpm version
pnpm -v
```

If you haven't installed these tools:
1. Install Node.js from the [official website](https://nodejs.org/en) or via Homebrew
2. Install pnpm globally using npm: `npm install -g pnpm`

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/akshada2712/Presentation-Coach.git
cd confidence-ai
```

2. Set up environment variables:
- Copy the example environment file:
```bash
cp .env.example .env
```
- Add your API keys to `.env`:
```
VITE_HUME_API_KEY=<YOUR_API_KEY>
VITE_HUME_SECRET_KEY=<YOUR_SECRET_KEY>
VITE_GROQ_API_KEY=<YOUR_GROQ_API_KEY>
```

Note: You'll need to obtain API keys from:
- [Hume AI Portal](https://hume.docs.buildwithfern.com/docs/introduction/getting-your-api-key)
- [Groq](https://groq.com)

## Installation & Development

1. Install dependencies:
```bash
pnpm i
```

2. Build the project:
```bash
pnpm build
```

3. Start the development server:
```bash
pnpm dev
```

The application will be available at `localhost:5173`

## Usage Guide

1. **Start a Session**
   - Click the "Start" button to establish connection
   - Grant microphone and camera permissions when prompted
   
2. **During Presentation**
   - Begin your presentation
   - Real-time feedback will be displayed on screen
   - Voice tone, facial expressions, and body language are analyzed

3. **Review Feedback**
   - Get instant insights on your performance
   - Review emotion detection results
   - Receive actionable improvement suggestions

4. **End Session**
   - Click "Stop" to end the recording
   - Review your overall performance summary

## Tech Stack

- **Frontend**
  - TypeScript
  - Next.js
  - HTML/CSS
  
- **AI Integration**
  - Hume AI Empathic Voice Interface
  - Hume AI Expression Measurement API
  - Groq API for feedback generation

- **Real-time Processing**
  - WebSocket for streaming
  - FastAPI backend

## Future Development

- Advanced analytics and feedback mechanisms
- Mobile application development
- Expanded user testing
- Professional speaking coach partnerships
- Additional AI/ML model integrations
