let socket;
let audioContext;
let scriptProcessor;
let microphone;
let isRecording = false;

const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const vadState = document.getElementById('vad-state');
const transcriptBox = document.getElementById('transcript-box');
const ttsAudio = document.getElementById('tts-audio');

btnStart.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        microphone = audioContext.createMediaStreamSource(stream);
        
        // 512 frames = 32ms chunk at 16kHz, required exactly by Silero VAD
        scriptProcessor = audioContext.createScriptProcessor(512, 1, 1);
        
        connectWebSocket();

        scriptProcessor.onaudioprocess = (event) => {
            if (isRecording && socket && socket.readyState === WebSocket.OPEN) {
                const inputData = event.inputBuffer.getChannelData(0);
                
                // update mic level UI
                updateMicLevel(inputData);

                // Convert Float32 to Int16 for easier processing in Python VAD
                const int16Data = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                
                socket.send(int16Data.buffer);
            }
        };

        microphone.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);

        isRecording = true;
        
        btnStart.disabled = true;
        btnStart.classList.add('opacity-50', 'cursor-not-allowed');
        btnStop.disabled = false;
        btnStop.classList.remove('opacity-50', 'cursor-not-allowed');
        
        vadState.innerText = "LISTENING";
        vadState.className = "font-mono text-lg font-black text-blue-500";

    } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Please allow microphone access to run the benchmark.");
    }
});

btnStop.addEventListener('click', () => {
    if (isRecording) {
        microphone.disconnect();
        scriptProcessor.disconnect();
        audioContext.close();
        isRecording = false;
        
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'stop' }));
        }

        btnStart.disabled = false;
        btnStart.classList.remove('opacity-50', 'cursor-not-allowed');
        btnStop.disabled = true;
        btnStop.classList.add('opacity-50', 'cursor-not-allowed');
        
        vadState.innerText = "WAITING";
        vadState.className = "font-mono text-lg font-black text-gray-400";
        document.getElementById('mic-level').style.width = "0%";
    }
});

function connectWebSocket() {
    socket = new WebSocket(`ws://localhost:8000/ws`);
    
    socket.onmessage = (event) => {
        if (typeof event.data === 'string') {
            const data = JSON.parse(event.data);
            
            if (data.type === 'transcript') {
                transcriptBox.innerHTML += `<div class="mb-2"><span class="text-blue-600 font-bold">You:</span> ${data.text}</div>`;
                transcriptBox.scrollTop = transcriptBox.scrollHeight;
                
                document.getElementById('m-audio').innerText = `${data.audio_duration.toFixed(2)}s`;
                document.getElementById('m-stt').innerText = `${data.processing_time.toFixed(2)}s`;
                document.getElementById('m-rtf').innerText = `${data.rtf.toFixed(2)}`;
                document.getElementById('m-barge').innerText = `${data.barge_in_latency.toFixed(2)}s`;
            } else if (data.type === 'vad') {
                if (data.status === 'speech_started') {
                    vadState.innerText = "SPEECH STARTED";
                    vadState.className = "font-mono text-lg font-black text-green-500";
                } else if (data.status === 'speech_ended') {
                    vadState.innerText = "END OF TURN";
                    vadState.className = "font-mono text-lg font-black text-purple-500";
                }
            } else if (data.type === 'tts_metrics') {
                document.getElementById('m-tts').innerText = `${data.tts_time.toFixed(2)}s`;
            }
        } else if (event.data instanceof Blob) {
            const url = URL.createObjectURL(event.data);
            ttsAudio.src = url;
            ttsAudio.play();
            transcriptBox.innerHTML += `<div class="mb-2"><span class="text-green-600 font-bold">AI:</span> (Audio response playing)</div>`;
            transcriptBox.scrollTop = transcriptBox.scrollHeight;
        }
    };
}

function updateMicLevel(inputData) {
    let sum = 0;
    for (let i = 0; i < inputData.length; i++) sum += Math.abs(inputData[i]);
    const average = sum / inputData.length;
    const percentage = Math.min(100, Math.max(0, average * 3000));
    document.getElementById('mic-level').style.width = `${percentage}%`;
}
