import whisper
import pyaudio
import wave
import requests
import sys
import os
import time

# Suppress warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

class VoiceProctor:
    def __init__(self, user_id="unknown", backend_url="http://localhost:8000"):
        self.user_id = user_id
        self.backend_url = backend_url
        self.audio = pyaudio.PyAudio()
        self.running = False
        
        print(f"[*] Initializing Voice Proctor for user: {user_id}")
        
        # Load Whisper model (base is good balance of speed and accuracy)
        try:
            self.model = whisper.load_model("base")
            print("[+] Whisper model loaded successfully.")
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
            requests.post(f"{self.backend_url}/monitoring/events", json=payload, timeout=2)
            print(f"[ALERT] {alert_type}: {message}")
        except Exception as e:
            print(f"[-] Failed to report alert: {e}")

    def record_chunk(self, duration=5):
        """Records a 5-second audio chunk."""
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
                data = stream.read(1024)
                frames.append(data)

            stream.stop_stream()
            stream.close()

            if not self.running: return False

            # Save chunk to disk
            wf = wave.open(self.temp_filename, "wb")
            wf.setnchannels(1)
            wf.setsampwidth(self.audio.get_sample_size(pyaudio.paInt16))
            wf.setframerate(16000)
            wf.writeframes(b"".join(frames))
            wf.close()
            return True
        except Exception as e:
            print(f"[-] Recording error: {e}")
            return False

    def run(self):
        self.running = True
        print("[*] Voice Proctor listening. Press CTRL+C to stop.")
        
        while self.running:
            # 1. Record 5 seconds of audio
            if self.record_chunk(duration=5):
                # 2. Transcribe using Whisper
                try:
                    result = self.model.transcribe(self.temp_filename)
                    text = result.get("text", "").strip()
                    
                    if text:
                        print(f"[{self.user_id}] Detected: {text}")
                        # 3. Simple heuristic: if text is long enough, it's speech
                        if len(text) > 5:
                            self.report_alert("background_speech", f"Possible external assistance: '{text}'")
                except Exception as e:
                    print(f"[-] Transcription error: {e}")
                
                # 4. Clean up temp file
                if os.path.exists(self.temp_filename):
                    os.remove(self.temp_filename)
            
            # Short pause before next chunk
            time.sleep(0.5)

        self.stop()

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
