import whisper
import pyaudio
import wave
import requests

model = whisper.load_model("base")

audio = pyaudio.PyAudio()

stream = audio.open(
    format=pyaudio.paInt16,
    channels=1,
    rate=16000,
    input=True,
    frames_per_buffer=1024
)

print("Listening for background speech...")

frames = []

for i in range(0, int(16000 / 1024 * 5)):  # record 5 seconds
    data = stream.read(1024)
    frames.append(data)

wf = wave.open("temp.wav", "wb")
wf.setnchannels(1)
wf.setsampwidth(audio.get_sample_size(pyaudio.paInt16))
wf.setframerate(16000)
wf.writeframes(b"".join(frames))
wf.close()

result = model.transcribe("temp.wav")

text = result["text"]

print("Detected Speech:", text)

if len(text.strip()) > 5:

    print("ALERT: Background speech detected")

    requests.post(
        "http://localhost:8000/alert",
        json={
            "type":"background_voice",
            "message":"Possible external assistance detected"
        }
    )