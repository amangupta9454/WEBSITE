import time
import torch
import numpy as np

print("Loading Silero VAD...")
vad_model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=False)
(get_speech_timestamps, save_audio, read_audio, VADIterator, collect_chunks) = utils

# Test 1: Simulating Hesitation vs End-of-Turn
SAMPLE_RATE = 16000
CHUNK_SIZE = 512

# Create fake audio:
# 1s speech + 0.3s pause + 1s speech (Hesitation)
# 1s speech + 0.8s pause (End of turn)
def gen_fake_audio(duration, is_speech=True):
    num_samples = int(duration * SAMPLE_RATE)
    if is_speech:
        return np.random.uniform(-0.1, 0.1, num_samples).astype(np.float32)
    else:
        return np.zeros(num_samples, dtype=np.float32)

audio_hesitation = np.concatenate([
    gen_fake_audio(1.0, True),
    gen_fake_audio(0.3, False),
    gen_fake_audio(1.0, True),
    gen_fake_audio(1.0, False)
])

print("\n--- VAD Hesitation Test (0.3s pause) ---")
vad_iterator = VADIterator(vad_model, sampling_rate=SAMPLE_RATE, min_silence_duration_ms=700)
for i in range(0, len(audio_hesitation), CHUNK_SIZE):
    chunk = audio_hesitation[i:i+CHUNK_SIZE]
    if len(chunk) < CHUNK_SIZE:
        break
    tensor_chunk = torch.from_numpy(chunk)
    speech_dict = vad_iterator(tensor_chunk, return_seconds=True)
    if speech_dict:
        print(f"Time {i/SAMPLE_RATE:.2f}s: {speech_dict}")
        
audio_eot = np.concatenate([
    gen_fake_audio(1.0, True),
    gen_fake_audio(0.8, False)
])

print("\n--- VAD End-of-Turn Test (0.8s pause) ---")
vad_iterator.reset_states()
for i in range(0, len(audio_eot), CHUNK_SIZE):
    chunk = audio_eot[i:i+CHUNK_SIZE]
    if len(chunk) < CHUNK_SIZE:
        break
    tensor_chunk = torch.from_numpy(chunk)
    speech_dict = vad_iterator(tensor_chunk, return_seconds=True)
    if speech_dict:
        print(f"Time {i/SAMPLE_RATE:.2f}s: {speech_dict}")

