import { useState } from "react";
import axios from "axios";
import Proctoring from "../components/Proctoring";
import styles from "../styles/VoiceInterview.module.css";

function VoiceInterview() {
  const questions = [
    "Explain how Docker works",
    "What is AWS EC2",
    "What is gradient descent",
    "How do you optimize SQL queries",
    "What are Python decorators",
  ];

  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");

  const speakQuestion = () => {
    const speech = new SpeechSynthesisUtterance(questions[current]);

    speech.lang = "en-US";

    window.speechSynthesis.speak(speech);
  };

  const startListening = () => {
    const recognition = new window.webkitSpeechRecognition();

    recognition.lang = "en-US";

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      setAnswer(transcript);
    };
  };

  const nextQuestion = () => {
    setCurrent(current + 1);

    setAnswer("");
  };

  const evaluateAnswer = async () => {
    const res = await axios.post("http://localhost:8000/evaluate_answer", {
      answer: answer,
      question: questions[current],
    });
    alert("Score: " + res.data.score + "\nFeedback: " + res.data.feedback);
  };

  return (
    <div className={styles.voiceContainer}>
      <Proctoring />
      <h2 className={styles.header}>AI Voice Interview</h2>
      <h3 className={styles.question}>Question {current + 1}</h3>
      <p className={styles.question}>{questions[current]}</p>
      <button onClick={speakQuestion} className={styles.button}>
        🔊 Ask Question
      </button>
      <button onClick={startListening} className={styles.button}>
        🎤 Record Answer
      </button>
      <p className={styles.answer}>
        <b>Candidate Answer:</b>
      </p>
      <p className={styles.answer}>{answer}</p>
      <button onClick={nextQuestion} className={styles.button}>
        Next Question
      </button>
      <button onClick={evaluateAnswer} className={styles.button}>
        Evaluate Answer
      </button>
    </div>
  );
}

export default VoiceInterview;
