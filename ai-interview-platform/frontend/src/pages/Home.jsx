import React from "react";
import { motion } from "framer-motion";
import styles from "../styles/Home.module.css";

function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.center}>
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className={styles.title}
        >
          AI Recruitment Platform
        </motion.h1>
        <p className={styles.subtitle}>
          Automated Resume Screening & AI Interviews
        </p>
        <div className={styles.buttonRow}>
          <a href="/interview-flow" className={styles.button}>
            Start Interview
          </a>
          <a
            href="/dashboard"
            className={styles.dashboardButton + " " + styles.button}
          >
            Recruiter Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default Home;
