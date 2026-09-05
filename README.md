Song Fin♪er

Brief Summary
Song Fin♪er is a full-stack web application that lets users find songs by singing audio directly into their microphone. The app captures the audio, transcribes it using Groq's high-speed Whisper model, and queries the Genius API to return the exact song match along with lyrics links and album art.

Features Included
*   Frontend - Components: Built using React functional components with state management (`useState`, `useEffect`, `useRef`).
*   Frontend - Animations: Implemented CSS transitions (scaling, background color shifts) for interactive buttons and hover states.
*   Frontend - Mobile Responsiveness: Designed with flexible layouts and max-width containers to make sure that the UI scales cleanly on mobile devices.
*   Backend - API Calls: Asynchronously communicates with two external APIs: the Groq API (Whisper model) for audio transcription and the Genius API for fetching song metadata.
*   Full-Stack - Linking Frameworks: Links a React frontend (Vite) to a Python FastAPI backend, handling `FormData` POST requests for audio file transfers.
*   Misc (Cool Features): Used the browser's native `MediaRecorder` API to capture live microphone audio.

Time Spent Developing
6 hours

Youtube Demonstration
https://youtu.be/ivcaPeS-1wI