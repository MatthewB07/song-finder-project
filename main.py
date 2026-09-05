from fastapi import FastAPI, UploadFile, File, HTTPException
from groq import AsyncGroq
from dotenv import load_dotenv
import os

load_dotenv(".env.local")

app = FastAPI()

key = os.getenv("GROQ_API_KEY")
client = AsyncGroq(api_key=key)

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

@app.get("/")
def read_root():
    return {"Server": "Active"}

@app.post("/find")
async def find_song(file: UploadFile = File(...)):
    try:
        transcription = await transcribe(file)
        return transcription
    
    except Exception as e:
        raise HTTPException(
            status_code = 502, 
            detail = "Find failed: " + str(e)
        )

