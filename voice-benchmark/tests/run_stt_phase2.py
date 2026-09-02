import time
import os
import torch
import subprocess
from faster_whisper import WhisperModel

test_cases = [
    # Normal English
    "I designed the database schema to normalize user records.",
    "Can you tell me about a time you had a conflict with a teammate?",
    "We used agile methodologies, specifically Scrum, with two-week sprints.",
    # Indian English / Hinglish
    "Basically humne Redis ko caching ke liye use kiya tha, but cache invalidation ka issue aa raha tha.",
    "The production server went down because memory leak ho gaya tha.",
    "I have integrated Razorpay payment gateway in my final year project.",
    "Mera primary backend framework Node JS hai.",
    "Ek cron job schedule kiya tha midnight data sync karne ke liye.",
    # Fast Speech / Short Answers
    "Sure.",
    "I used React.",
    "PostgreSQL.",
    "I don't know.",
    "It was deployed on AWS EC2.",
    # Hesitation
    "I worked on... um... a payment system.",
    "We used... actually, we switched from REST to GraphQL.",
    "So... the main issue was latency.",
    # Technical Terms - Python / JS / General
    "I used asyncio and aiohttp for concurrent requests in Python.",
    "We wrote custom React hooks and used Redux Thunk for state management.",
    "The data processing pipeline was built using Pandas and NumPy.",
    "I prefer TypeScript over JavaScript because of static typing.",
    # Tech - K8s / AWS / DB
    "I deployed the application using Docker and Kubernetes on AWS EKS.",
    "We used AWS Lambda and S3 for event-driven processing.",
    "The database was scaled using read replicas and connection pooling in pgBouncer.",
    "We migrated from MongoDB to PostgreSQL for better ACID compliance.",
    # Tech - System Design
    "We used eventual consistency and a distributed pub-sub model with Apache Kafka.",
    "A reverse proxy like Nginx or HAProxy handles TLS termination and load balancing.",
    "We implemented a circuit breaker pattern using Resilience4j.",
    # Numbers / Versions / Acronyms
    "We updated the project from Node version 14 to version 20.",
    "The SLA for our APIs is 99.99 percent availability.",
    "We used JWT for auth and configured CI/CD via GitHub Actions."
]

models_to_test = ["small", "medium", "large-v3"]

print("========================================")
print("     PHASE 2 STT BENCHMARK RUNNER       ")
print("========================================")

def run_benchmark():
    for model_name in models_to_test:
        print(f"\nLoading Whisper model: {model_name}...")
        start_load = time.time()
        try:
            model = WhisperModel(model_name, device="cpu", compute_type="int8")
            load_time = time.time() - start_load
            print(f"Loaded '{model_name}' in {load_time:.2f}s")
            
            total_processing_time = 0
            total_audio_duration = 0
            
            for i, sentence in enumerate(test_cases):
                audio_file = f"test_{model_name}_{i}.m4a"
                wav_file = f"test_{model_name}_{i}.wav"
                
                # Synthetic TTS Generation
                subprocess.run(["say", "-v", "Samantha", "-o", audio_file, "--data-format=aac", sentence])
                subprocess.run(["ffmpeg", "-y", "-i", audio_file, "-ar", "16000", "-ac", "1", wav_file], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                try:
                    import soundfile as sf
                    f = sf.SoundFile(wav_file)
                    audio_duration = len(f) / f.samplerate
                except:
                    audio_duration = 3.0
                    
                start_stt = time.time()
                segments, info = model.transcribe(wav_file, beam_size=1, language="en")
                transcript = "".join([s.text for s in segments])
                stt_time = time.time() - start_stt
                
                total_audio_duration += audio_duration
                total_processing_time += stt_time
                
                # Print sample output for a few
                if i % 10 == 0:
                    print(f"[{i}/30] Original: {sentence}")
                    print(f"[{i}/30] STT:      {transcript.strip()}")
                
                os.remove(audio_file)
                os.remove(wav_file)
                
            avg_rtf = total_processing_time / total_audio_duration if total_audio_duration > 0 else 0
            print(f"--- RESULTS FOR {model_name.upper()} ---")
            print(f"Avg RTF: {avg_rtf:.2f}")
            print(f"Total Processing: {total_processing_time:.2f}s for {total_audio_duration:.2f}s audio")
            
            # Explicitly free memory (delete model and empty cache if applicable)
            del model
            import gc
            gc.collect()
            
        except Exception as e:
            print(f"FAILED to benchmark {model_name}: {e}")

if __name__ == "__main__":
    run_benchmark()
