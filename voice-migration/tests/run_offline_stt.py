import time
import os
import torch
import subprocess
from faster_whisper import WhisperModel

sentences = [
    "I designed a distributed microservices architecture using Kafka, Redis, PostgreSQL, Kubernetes, and gRPC.",
    "We implemented JWT based authentication with OAuth 2.0 and refresh token rotation.",
    "The system used eventual consistency and asynchronous event processing.",
    "I deployed the application using Docker and Kubernetes on AWS.",
    "We reduced API latency from approximately 800 milliseconds to 120 milliseconds.",
    "Basically humne Redis ko caching ke liye use kiya tha, but cache invalidation ka issue aa raha tha."
]

print("Loading model deepaval/Whisper-Large-v3-Turbo...")
model = WhisperModel("large-v3", device="cpu", compute_type="int8")

print("\n--- STT Benchmark Results ---\n")

for i, sentence in enumerate(sentences):
    # 1. Generate audio using TTS 'say'
    audio_file = f"test_{i}.m4a"
    wav_file = f"test_{i}.wav"
    subprocess.run(["say", "-v", "Samantha", "-o", audio_file, "--data-format=aac", sentence])
    subprocess.run(["ffmpeg", "-y", "-i", audio_file, "-ar", "16000", "-ac", "1", wav_file], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # 2. Get audio duration
    try:
        import soundfile as sf
        f = sf.SoundFile(wav_file)
        audio_duration = len(f) / f.samplerate
    except Exception as e:
        audio_duration = 3.0 # fallback approx
        
    # 3. Transcribe
    start_time = time.time()
    segments, info = model.transcribe(wav_file, beam_size=1, language="en")
    transcript = "".join([s.text for s in segments])
    end_time = time.time()
    
    processing_time = end_time - start_time
    rtf = processing_time / audio_duration
    
    print(f"Original: {sentence}")
    print(f"Transcribed: {transcript.strip()}")
    print(f"Audio Duration: {audio_duration:.2f}s | Processing Time: {processing_time:.2f}s | RTF: {rtf:.2f}")
    print("-" * 50)
    
    os.remove(audio_file)
    os.remove(wav_file)
