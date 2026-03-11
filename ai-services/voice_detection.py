import whisper
import pyaudio
import wave
import requests
import time
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class VoiceProctor:
    def __init__(self, api_url="http://127.0.0.1:8000/alert", model_size="base"):
        self.api_url = api_url
        logger.info(f"Loading Whisper model ({model_size})...")
        self.model = whisper.load_model(model_size)
        self.audio = pyaudio.PyAudio()
        self.temp_filename = "temp_voice.wav"

    def record_chunk(self, seconds=5):
        """Record a short chunk of audio."""
        chunk = 1024
        sample_format = pyaudio.paInt16
        channels = 1
        fs = 16000
        
        stream = self.audio.open(
            format=sample_format,
            channels=channels,
            rate=fs,
            input=True,
            frames_per_buffer=chunk
        )

        frames = []
        for _ in range(0, int(fs / chunk * seconds)):
            data = stream.read(chunk)
            frames.append(data)

        stream.stop_stream()
        stream.close()

        # Save to temporary file
        wf = wave.open(self.temp_filename, "wb")
        wf.setnchannels(channels)
        wf.setsampwidth(self.audio.get_sample_size(sample_format))
        wf.setframerate(fs)
        wf.writeframes(b"".join(frames))
        wf.close()

    def analyze_audio(self):
        """Transcribe and check for speech."""
        if not os.path.exists(self.temp_filename):
            return

        result = self.model.transcribe(self.temp_filename, fp16=False)
        text = result.get("text", "").strip()
        
        if len(text) > 10: # Minimum character threshold to avoid noise
            logger.info(f"Detected Speech: {text}")
            self.send_alert(text)
        
        # Cleanup
        try:
            os.remove(self.temp_filename)
        except:
            pass

    def send_alert(self, detected_text):
        try:
            requests.post(
                self.api_url,
                json={
                    "type": "background_voice",
                    "message": f"Possible assistance detected: '{detected_text}'"
                },
                timeout=2
            )
        except Exception as e:
            logger.error(f"Failed to send voice alert: {e}")

    def run(self):
        logger.info("Voice Proctoring Active (Continuous monitoring)...")
        try:
            while True:
                self.record_chunk(seconds=5)
                self.analyze_audio()
                time.sleep(0.5) # Short pause between chunks
        except KeyboardInterrupt:
            logger.info("Voice Proctoring stopped.")
        finally:
            self.audio.terminate()

if __name__ == "__main__":
    proctor = VoiceProctor()
    proctor.run()
