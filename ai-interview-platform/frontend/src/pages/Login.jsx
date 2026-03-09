import axios from "axios";
import styles from "../styles/Login.module.css";

const uploadResume = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const res = await axios.post("http://localhost:8000/upload_resume", formData);

  console.log(res.data);
};

function Login() {
  return (
    <div className={styles.loginContainer}>
      <h2 className={styles.header}>Login</h2>
      <input
        type="file"
        onChange={(e) => uploadResume(e.target.files[0])}
        className={styles.input}
      />
    </div>
  );
}

export default Login;
