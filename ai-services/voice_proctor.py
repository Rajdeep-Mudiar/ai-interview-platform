import whisper
import pyaudio
import wave
import requests
import sys
import os
import time
import numpy as np

# Suppress warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

class VoiceProctor:
    def __init__(self, user_id="unknown", backend_url="http://127.0.0.1:8000"):
        self.user_id = user_id
        self.backend_url = backend_url
        self.audio = pyaudio.PyAudio()
        self.running = False
        
        print(f"[*] Initializing Voice Proctor for user: {user_id}")
        
        # Check for ffmpeg
        import shutil
        if not shutil.which("ffmpeg"):
            print("[-] WARNING: ffmpeg not found in PATH. Whisper transcription may fail.")
            print("[-] Please install ffmpeg: https://ffmpeg.org/download.html")
        
        # Load Whisper model (base is good balance of speed and accuracy)
        try:
            # Using 'tiny' for even faster performance on local machines
            self.model = whisper.load_model("tiny")
            print("[+] Whisper model (tiny) loaded successfully.")
        except Exception as e:
            print(f"[-] Failed to load Whisper: {e}")
            sys.exit(1)
            
        self.temp_filename = f"voice_chunk_{user_id}.wav"
        print("[+] Voice Proctor ready.")

    def report_alert(self, alert_type, message, confidence=1.0):
        """Sends an alert to the backend server."""
        try:
            payload = {
                "session_id": self.user_id,
                "device": "microphone",
                "event": alert_type,
                "confidence_score": confidence,
                "message": message,
                "timestamp": time.time()
            }
            # Use 127.0.0.1 for consistency
            requests.post(f"{self.backend_url}/monitoring/events", json=payload, timeout=2)
            print(f"[ALERT] {alert_type}: {message}")
        except Exception as e:
            print(f"[-] Failed to report alert: {e}")

    def record_chunk(self, duration=5):
        """Records a 5-second audio chunk and returns as numpy array."""
        try:
            stream = self.audio.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                frames_per_buffer=1024
            )

            frames = []
            for _ in range(0, int(16000 / 1024 * duration)):
                if not self.running: break
                try:
                    data = stream.read(1024, exception_on_overflow=False)
                    frames.append(data)
                except Exception as e:
                    print(f"[-] Audio overflow/read error: {e}")
                    continue

            stream.stop_stream()
            stream.close()

            if not self.running: return None

            # Convert to numpy array directly for Whisper to avoid some ffmpeg dependency issues
            audio_data = b"".join(frames)
            audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
            return audio_np
        except Exception as e:
            print(f"[-] Recording error: {e}")
            return None

    def run(self):
        self.running = True
        print("[*] Voice Proctor listening. Press CTRL+C to stop.")
        
        while self.running:
            # 1. Record 5 seconds of audio
            audio_np = self.record_chunk(duration=5)
            if audio_np is not None:
                # 2. Transcribe using Whisper (passing numpy array)
                try:
                    # Pass the numpy array directly
                    result = self.model.transcribe(audio_np, fp16=False)
                    text = result.get("text", "").strip()
                    
                    if text:
                        print(f"[{self.user_id}] Detected: {text}")
                        # Filter out common hallucinations or very short sounds
                        hallucinations = ["Thank you.", "Thanks for watching!", "Subtitle by"]
                        is_hallucination = any(h in text for h in hallucinations)
                        
                        if len(text) > 8 and not is_hallucination:
                            self.report_alert("background_speech", f"Possible external assistance: '{text}'")
                except Exception as e:
                    print(f"[-] Transcription error: {e}")
                    print("[-] Tip: Ensure ffmpeg is installed and in your PATH.")
            
            # Short pause before next chunk
            time.sleep(0.5)

        self.stop()

    def stop(self):
        self.running = False
        if self.audio:
            self.audio.terminate()
        print("[*] Voice Proctor stopped.")

    def stop(self):
        self.running = False
        if self.audio:
            self.audio.terminate()
        print("[*] Voice Proctor stopped.")

if __name__ == "__main__":
    uid = sys.argv[1] if len(sys.argv) > 1 else "unknown"
    proctor = VoiceProctor(user_id=uid)
    try:
        proctor.run()
    except KeyboardInterrupt:
        proctor.stop()
