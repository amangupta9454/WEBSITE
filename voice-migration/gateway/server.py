import asyncio
import time
import json
import numpy as np
import torch
import subprocess
import os
import aiohttp
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Whisper model size — configurable via env. "medium" balances accuracy and speed on CPU.
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "medium")

# The Gateway no longer directly calls Groq; all inference routes through the Node.js backend.
groq_client = None

print(f"Loading Whisper {WHISPER_MODEL}...")
model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")

print("Loading Silero VAD...")
vad_model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=False)
(get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = utils

SAMPLE_RATE = 16000

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # FIX 1: Increase silence threshold from 700ms → 1200ms.
    # 700ms was cutting off mid-sentence pauses in natural speech (especially with clause-level
    # hesitation common in Indian-accented English). 1200ms ensures a complete sentence is
    # captured before VAD fires end-of-speech.
    vad_iterator = VADIterator(vad_model, sampling_rate=SAMPLE_RATE, min_silence_duration_ms=1200, threshold=0.3)
    
    audio_buffer = []
    speech_active = False
    
    # State
    assistant_config = None
    squad_config = None
    active_assistant_name = None
    # FIX 2: conversation_history MUST mirror the full dialogue so the backend has complete context.
    # Both assistant-initiated messages AND user responses must be recorded here.
    conversation_history = []
    session_id = None
    token = None
    current_stage = "Introduction"
    
    # Voice Mapping for Piper (Mock mappings for testing)
    voice_map = {
        "nova": "en_US-lessac-medium.onnx",    # female
        "echo": "en_US-ryan-medium.onnx",      # male
        "shimmer": "en_US-lessac-medium.onnx",
        "alloy": "en_US-ryan-medium.onnx",
        "onyx": "en_US-ryan-medium.onnx",
        "fable": "en_US-lessac-medium.onnx",
    }
    
    # TTS Barge-in tracking
    current_tts_task = None
    
    async def synthesize_and_send(text: str, websocket: WebSocket):
        """Uses Piper TTS to synthesize speech and send via WebSocket."""
        tts_file = f"temp_{id(websocket)}_{time.time()}.wav"
        
        # Determine Piper Voice Model
        voice_id = "nova"
        if assistant_config and 'voice' in assistant_config:
            voice_id = assistant_config['voice'].get('voiceId', 'nova')
        
        piper_model_name = voice_map.get(voice_id, "en_US-lessac-medium.onnx")
        model_path = os.getenv("PIPER_MODEL_PATH", piper_model_name)
        
        piper_exists = subprocess.run(["which", "piper"], capture_output=True).returncode == 0
        if piper_exists and os.path.exists(model_path):
            process = subprocess.Popen(["piper", "--model", model_path, "--output_file", tts_file], stdin=subprocess.PIPE)
            process.communicate(input=text.encode('utf-8'))
        else:
            # Fallback to macOS say with different voices
            mac_voice = "Samantha" if voice_id in ["nova", "shimmer", "fable"] else "Alex"
            subprocess.run(["say", "-v", mac_voice, "-o", tts_file, "--data-format=LEF32@16000", text])
            
        if os.path.exists(tts_file):
            with open(tts_file, "rb") as f:
                await websocket.send_bytes(f.read())
            os.remove(tts_file)
            
    async def get_ai_response(user_text: str, websocket: WebSocket):
        """Sends user speech to the authoritative Node.js interview brain and speaks the response."""
        nonlocal current_tts_task, active_assistant_name, current_stage
        
        await websocket.send_json({"type": "ai-speech-start"})
        
        # FIX 3: Append user turn BEFORE calling backend so the full exchange is in context.
        conversation_history.append({"role": "user", "transcript": user_text})
        print(f"[Gateway] User said: {user_text[:80]}...")
        print(f"[Gateway] Sending {len(conversation_history)} turns to backend (session={session_id})")
        
        ai_text = ""
        try:
            async with aiohttp.ClientSession() as http_session:
                payload = {
                    "sessionId": session_id,
                    "transcript": conversation_history,
                    "currentInterviewer": active_assistant_name or "standard",
                    "currentStage": current_stage
                }
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                
                async with http_session.post(
                    "http://localhost:5006/api/interview/chat",
                    json=payload,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        ai_text = data.get("content", "")
                        # Update speaker/stage based on authoritative backend response
                        active_assistant_name = data.get("interviewer", active_assistant_name)
                        current_stage = data.get("nextStage", current_stage)
                        print(f"[Gateway] AI response ({active_assistant_name}): {ai_text[:80]}...")
                    else:
                        error_body = await response.text()
                        print(f"[Gateway] Backend API Error {response.status}: {error_body}")
                        ai_text = "I'm having trouble connecting to the interview brain right now."
        except Exception as e:
            print(f"[Gateway] Backend API Exception: {e}")
            ai_text = "I'm having trouble connecting to the backend right now."
            
        # FIX 3 (continued): Record assistant response in conversation history so subsequent
        # turns include the full Q&A chain, giving the LLM complete context for next question.
        if ai_text:
            conversation_history.append({"role": "assistant", "transcript": ai_text})
        
        # Send transcript of AI response back to UI
        await websocket.send_json({
            "type": "transcript",
            "role": "assistant",
            "text": ai_text
        })
        
        # Trigger TTS (can be cancelled if user barges in)
        current_tts_task = asyncio.create_task(synthesize_and_send(ai_text, websocket))
        try:
            await current_tts_task
        except asyncio.CancelledError:
            print("[Gateway] TTS Task Cancelled due to Barge-In")
        finally:
            await websocket.send_json({"type": "ai-speech-end"})
            current_tts_task = None
    
    try:
        while True:
            data = await websocket.receive()
            
            if "bytes" in data:
                raw_bytes = data["bytes"]
                int16_array = np.frombuffer(raw_bytes, dtype=np.int16)
                float32_array = (int16_array.astype(np.float32) / 32768.0) * 3.0
                
                audio_buffer.append(float32_array)
                
                for i in range(0, len(float32_array), 512):
                    window = float32_array[i:i+512]
                    if len(window) < 512:
                        window = np.pad(window, (0, 512 - len(window)), 'constant')
                        
                    chunk_tensor = torch.from_numpy(window)
                    speech_dict = vad_iterator(chunk_tensor, return_seconds=True)
                    
                    if speech_dict:
                        if 'start' in speech_dict:
                            if not speech_active:
                                speech_active = True
                                await websocket.send_json({"type": "vad", "status": "speech_started"})
                                
                                # BARGE-IN: Cancel TTS if candidate starts speaking
                                if current_tts_task and not current_tts_task.done():
                                    current_tts_task.cancel()
                                    current_tts_task = None
                                    print("[Gateway] Barge-in detected! Cancelled TTS.")
                                    await websocket.send_json({"type": "interrupt"})
                        
                        if 'end' in speech_dict:
                            if speech_active:
                                speech_active = False
                                await websocket.send_json({"type": "vad", "status": "speech_ended"})
                                
                                full_audio = np.concatenate(audio_buffer)
                                
                                # FIX 4: Use beam_size=5 (was 1) for better STT accuracy.
                                # beam_size=1 is greedy — fastest but most error-prone for
                                # accented speech or technical terms. beam_size=5 is still
                                # fast on CPU and dramatically reduces word errors.
                                segments, info = model.transcribe(
                                    full_audio,
                                    beam_size=5,
                                    language="en",
                                    vad_filter=False  # VAD already handled above
                                )
                                transcribed_text = "".join([segment.text for segment in segments]).strip()
                                
                                if transcribed_text:
                                    print(f"[Gateway] STT transcribed: {transcribed_text}")
                                    await websocket.send_json({
                                        "type": "transcript",
                                        "role": "user",
                                        "text": transcribed_text
                                    })
                                    
                                    # Trigger AI Response asynchronously
                                    asyncio.create_task(get_ai_response(transcribed_text, websocket))
                                else:
                                    print("[Gateway] STT returned empty transcript — ignoring segment")
                                
                                audio_buffer = []
                                vad_iterator.reset_states()

            elif "text" in data:
                text_data = json.loads(data["text"])
                msg_type = text_data.get("type")
                
                if msg_type == "stop":
                    break
                elif msg_type == "config":
                    assistant_config = text_data.get("assistant")
                    squad_config = text_data.get("squadConfig")
                    session_id = text_data.get("sessionId")
                    token = text_data.get("token")
                    if squad_config and 'members' in squad_config and len(squad_config['members']) > 0:
                        active_assistant_name = squad_config['members'][0]['assistant']['name']
                        assistant_config = squad_config['members'][0]['assistant']
                    print(f"[Gateway] Session configured: {session_id}, interviewer={active_assistant_name}")
                    
                elif msg_type == "client-message":
                    client_msg = text_data.get("message")
                    if client_msg.get("type") == "add-message":
                        msg_content = client_msg.get("message", {}).get("content", "")
                        
                        # Panel Router: Intercept handoff commands
                        if "ROUTER COMMAND: Execute the handoff tool to" in msg_content:
                            target = msg_content.split("to ")[1].split(" ")[0].strip()
                            print(f"[Gateway] Panel Router: Switching to {target}")
                            
                            if squad_config and 'members' in squad_config:
                                for member in squad_config['members']:
                                    if member['assistant']['name'] == target:
                                        assistant_config = member['assistant']
                                        active_assistant_name = target
                                        break
                                        
                            await websocket.send_json({
                                "type": "transfer-update",
                                "destination": {"assistantName": target}
                            })
                        else:
                            # FIX 5: The opening "add-message" from the frontend is the ASSISTANT's
                            # first message (e.g., interviewer introduction / first question).
                            # Record it as an assistant turn so the backend has full context from turn 1.
                            if client_msg.get("triggerResponseEnabled"):
                                # This fires the first AI response — treat msg_content as the
                                # assistant's opening prompt, not a user message.
                                print(f"[Gateway] Opening prompt: {msg_content[:80]}...")
                                asyncio.create_task(get_ai_response(msg_content, websocket))
                            elif msg_content:
                                # Non-trigger messages are assistant injections — record in history
                                conversation_history.append({"role": "assistant", "transcript": msg_content})
                                print(f"[Gateway] Assistant injection recorded: {msg_content[:80]}...")

    except WebSocketDisconnect:
        print(f"[Gateway] WebSocket disconnected for session {session_id}")
    except Exception as e:
        print(f"[Gateway] Error: {e}")
        import traceback
        traceback.print_exc()
