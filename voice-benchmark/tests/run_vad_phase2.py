import time
import torch
import subprocess
import os

print("========================================")
print("     PHASE 2 VAD BENCHMARK RUNNER       ")
print("========================================")

print("Loading Silero VAD...")
vad_model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=False)
(get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = utils

SAMPLE_RATE = 16000
CHUNK_SIZE = 512

print("Loading test audio...")
audio_speech = read_audio("en.wav")

def create_test_case(pause_duration):
    pause_samples = int(pause_duration * SAMPLE_RATE)
    pause_audio = torch.zeros(pause_samples)
    return torch.cat([audio_speech, pause_audio, audio_speech])




test_cases = {
    "Natural Hesitation (0.3s pause)": create_test_case(0.3),
    "Thinking Pause (0.8s pause)": create_test_case(0.8),
    "Sentence-ending Pause (1.0s pause)": create_test_case(1.0),
    "Long Candidate Hesitation (1.5s pause)": create_test_case(1.5),
}

silence_thresholds_ms = [500, 700, 900, 1200]

for threshold in silence_thresholds_ms:
    print(f"\n--- Testing min_silence_duration_ms = {threshold}ms ---")
    
    for case_name, full_audio in test_cases.items():
        vad_iterator = VADIterator(vad_model, sampling_rate=SAMPLE_RATE, min_silence_duration_ms=threshold)
        
        print(f"  Case: {case_name}")
        speech_ended_at = None
        for i in range(0, len(full_audio), CHUNK_SIZE):
            chunk = full_audio[i:i+CHUNK_SIZE]
            if len(chunk) < CHUNK_SIZE:
                break
            speech_dict = vad_iterator(chunk, return_seconds=True)
            
            if speech_dict and 'end' in speech_dict:
                speech_ended_at = i / SAMPLE_RATE
                print(f"    -> End-of-Turn Detected at {speech_ended_at:.2f}s")
                break
                
        if not speech_ended_at:
            print(f"    -> No End-of-Turn Detected (Wait for more audio)")
            

