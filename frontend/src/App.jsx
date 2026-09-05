import './App.css';
import { useState, useEffect, useRef } from "react";
import { useStopwatch } from "react-timer-hook";

function App() {
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const {
    milliseconds,
    seconds,
    minutes,
    start,
    pause,
    reset,
  } = useStopwatch({ autoStart: false });

  useEffect(() => {
    if (loading) {
      reset();
      start();
    } else {
      pause();
    }
  }, [loading]);

  const startRecording = async () => {
    try {
      setAudioBlob(null);
      setMatches(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert("Please allow microphone access in your browser settings to record.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadFile = async () => {
    if (!audioBlob) return;

    setMatches(null);
    setTranscription(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", audioBlob, "voice_recording.webm");

    try {
      const response = await fetch("http://127.0.0.1:8000/find", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.detail) {
      alert("Server error: " + data.detail);
      } else {
        setTranscription(data.transcription);

        if (data.search_result.message) {
          alert(data.search_result.message); 
        } else {
          setMatches(data.search_result.matches);
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => String(time).padStart(2, '0');

  return (
    <div className="app-container">
      <h1>Song Fin<span>♪</span>er</h1>
      <h3>Hum, sing, or play a song!</h3>

      <div className="recording-controls">
        {!isRecording ? (
          <button className="record-btn" onClick={startRecording} disabled={loading}>
            🎙️ Start Recording
          </button>
        ) : (
          <button className="stop-btn" onClick={stopRecording}>
            ⏹ Stop Recording
          </button>
        )}
      </div>

      {audioBlob && !isRecording && (
        <div className="search-section" >
          <audio src={URL.createObjectURL(audioBlob)} controls/>
          <button
            className="search-btn"
            onClick={uploadFile}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Find Song'}
          </button>
        </div>
      )}

      {loading && (
        <p><em>Analyzing audio and searching Genius...</em></p>
      )}

      {matches && matches.length > 0 && (
        <div className="result-section">
          <p className="timer">
            <strong>Search Time:</strong> {formatTime(minutes)}:{formatTime(seconds)}:{formatTime(milliseconds)}
          </p>

          <div className="transcription-box">
            <h3>What we heard:</h3>
            <p><em>"{transcription}"</em></p>
          </div>
          
          <h2 className="match-title">Top Match</h2>
          
          <div className="top-match-card">
            <img src={matches[0].image_url} alt={matches[0].title} width="200" />
            <h2>{matches[0].title}</h2>
            <h3>By {matches[0].artist}</h3>
            <a href={matches[0].genius_url} target="_blank" rel="noopener noreferrer">View Lyrics on Genius</a>
          </div>

          {matches.length > 1 && (
            <>
              <h3>Other Possibilities</h3>
              <ul className="alternate-matches-list">
                {matches.slice(1).map((song, index) => (
                  <li key={index}>
                    <img src={song.image_url} alt={song.title} width="50"/>
                    <div>
                      <strong>{song.title}</strong> — {song.artist} <br />
                      <a href={song.genius_url} target="_blank" rel="noopener noreferrer">View on Genius</a>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;