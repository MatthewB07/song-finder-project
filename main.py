from fastapi import FastAPI, UploadFile, File, HTTPException
from groq import AsyncGroq
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx

load_dotenv(".env.local")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

transcription_key = os.getenv("GROQ_API_KEY")
if not transcription_key:
    raise HTTPException(status_code = 500, detail = "Groq API key missing.")

client = AsyncGroq(api_key = transcription_key)

async def transcribe(file: UploadFile):
    try: 
        audio_bytes = await file.read()

        transcription = await client.audio.transcriptions.create(
        file=(file.filename, audio_bytes),
        model="whisper-large-v3-turbo",
        temperature=0,
        response_format="verbose_json",
        )
        return transcription.text
    
    except Exception as e:
        raise HTTPException(
            status_code = 502, 
            detail = "Transcription failed: " + str(e)
        )

async def search_genius(transcription: str):
    genius_token = os.getenv("GENIUS_ACCESS_TOKEN")
    if not genius_token:
        raise HTTPException(status_code = 500, detail = "Genius API token missing.")
    
    url = "https://api.genius.com/search"
    headers = {"Authorization": f"Bearer {genius_token}"}
    params = {"q": transcription}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers = headers, params = params)

        if response.status_code != 200:
            raise HTTPException(status_code = 502, detail = "Genius API search failed")
        
        data = response.json()
    
    hits = data.get("response", {}).get("hits", [])
    if not hits:
        return {"message": "No matching song found on Genius."}
    
    top_hits = hits[:5]

    matched_songs = []

    for hit in top_hits:
        song_data = hit["result"]

        matched_songs.append({
            "title": song_data.get("title"),
            "artist": song_data.get("primary_artist", {}).get("name"),
            "image_url": song_data.get("song_art_image_thumbnail_url"),
            "genius_url": song_data.get("url")
        })

    return {"matches": matched_songs}

@app.get("/")
def read_root():
    return {"Server": "Active"}

@app.post("/find")
async def find_song(file: UploadFile = File(...)):
    try:
        transcription = await transcribe(file)
        
        matched_songs = await search_genius(transcription)

        return {
            "transcription": transcription,
            "search_result": matched_songs
        }
    
    except Exception as e:
        raise HTTPException(
            status_code = 502, 
            detail = "Find failed: " + str(e)
        )

