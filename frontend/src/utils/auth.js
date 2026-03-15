export function saveUserSession(user) {
  try {
    localStorage.setItem("cb_user", JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

export function getUserSession() {
  try {
    const raw = localStorage.getItem("cb_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearUserSession() {
  try {
    localStorage.removeItem("cb_user");
  } catch {
    // ignore
  }
}

