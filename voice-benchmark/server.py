import asyncio
import time
import json
import numpy as np
import torch
import subprocess
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

print("Loading Whisper Medium...")
# Force CPU for Whisper if MPS is unstable with CTranslate2. 
# CTranslate2 doesn't fully support MPS natively for Whisper yet, CPU is safest.
model = WhisperModel("medium", device="cpu", compute_type="int8")

print("Loading Silero VAD...")
vad_model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=False)
(get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = utils

# Silero VAD expects 16000 Hz, Float32 tensors
SAMPLE_RATE = 16000

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Initialize VAD iterator for this connection with high sensitivity (0.2 threshold)
    vad_iterator = VADIterator(vad_model, sampling_rate=SAMPLE_RATE, min_silence_duration_ms=700, threshold=0.2)
    
    audio_buffer = []
    speech_active = False
    chunk_count = 0
    
    try:
        while True:
            # Receive Int16 array buffer from JS
            data = await websocket.receive()
            
            if "bytes" in data:
                raw_bytes = data["bytes"]
                # Convert Int16 to Float32 [-1.0, 1.0] and apply Gain of 3.0 for quiet mics
                int16_array = np.frombuffer(raw_bytes, dtype=np.int16)
                float32_array = (int16_array.astype(np.float32) / 32768.0) * 3.0
                
                chunk_count += 1
                if chunk_count % 50 == 0:
                    print(f"DEBUG: Max amplitude in recent chunk: {np.max(np.abs(float32_array)):.4f}")
                
                audio_buffer.append(float32_array)
                
                # Check VAD for this chunk by slicing into exactly 512-sample windows
                # (Browsers might send 4096 or arbitrary sizes despite requesting 512)
                for i in range(0, len(float32_array), 512):
                    window = float32_array[i:i+512]
                    if len(window) < 512:
                        # Pad with zeros if it's not exactly 512
                        window = np.pad(window, (0, 512 - len(window)), 'constant')
                        
                    chunk_tensor = torch.from_numpy(window)
                    speech_dict = vad_iterator(chunk_tensor, return_seconds=True)
                    
                    if speech_dict:
                        if 'start' in speech_dict:
                            if not speech_active:
                                speech_active = True
                                await websocket.send_json({"type": "vad", "status": "speech_started"})
                        
                        if 'end' in speech_dict:
                            if speech_active:
                                speech_active = False
                                await websocket.send_json({"type": "vad", "status": "speech_ended"})
                                
                                # Process Accumulated Audio
                                full_audio = np.concatenate(audio_buffer)
                                audio_duration = len(full_audio) / SAMPLE_RATE
                                
                                start_stt = time.time()
                                segments, info = model.transcribe(full_audio, beam_size=1, language="en")
                                text = "".join([segment.text for segment in segments])
                                stt_time = time.time() - start_stt
                                
                                rtf = stt_time / audio_duration if audio_duration > 0 else 0
                                
                                # Barge-in Latency is roughly the STT time (time from candidate stopping to STT finishing)
                                barge_in_latency = stt_time
                                
                                await websocket.send_json({
                                    "type": "transcript",
                                    "text": text.strip(),
                                    "audio_duration": audio_duration,
                                    "processing_time": stt_time,
                                    "rtf": rtf,
                                    "barge_in_latency": barge_in_latency
                                })
                                
                                # Clear buffer for next turn
                                audio_buffer = []
                                vad_iterator.reset_states()
                                
                                # Generate Mock TTS using macOS 'say' (M4A format)
                                start_tts = time.time()
                                mock_reply = "I see. You mentioned " + text.split(" ")[-1] + ". Tell me more about that."
                                if len(text.strip()) == 0:
                                    mock_reply = "I didn't quite catch that."
                                    
                                tts_file = f"temp_{id(websocket)}.m4a"
                                subprocess.run(["say", "-v", "Samantha", "-o", tts_file, "--data-format=aac", mock_reply])
                                tts_time = time.time() - start_tts
                                
                                await websocket.send_json({"type": "tts_metrics", "tts_time": tts_time})
                                
                                with open(tts_file, "rb") as f:
                                    await websocket.send_bytes(f.read())
                                    
                                if os.path.exists(tts_file):
                                    os.remove(tts_file)

            elif "text" in data:
                text_data = json.loads(data["text"])
                if text_data.get("type") == "stop":
                    break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Error: {e}")
