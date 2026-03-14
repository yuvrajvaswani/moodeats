import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/assistant";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userName", response.data.user?.name || email.trim().split("@")[0] || "Friend");
      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          heightCm: response.data.user?.heightCm ?? null,
          weightKg: response.data.user?.weightKg ?? null,
        })
      );
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Cannot reach server. Please make sure backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError("");
      const response = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userName", response.data.user?.name || "Friend");
      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          heightCm: response.data.user?.heightCm ?? null,
          weightKg: response.data.user?.weightKg ?? null,
        })
      );
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Google login failed. Check backend and Google client configuration."
      );
    }
  };

  return (
    <div className="app-shell">
      <div className="panel panel--auth">
        <h1 className="brand">MoodEats 🍜</h1>
        <p className="subtitle">Hungry but confused? We got you.</p>
        <img className="auth-hero" src="/food-wave.svg" alt="Colorful food illustration" />
        <form className="form-stack" onSubmit={handleSubmit}>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        {error && <p className="error">{error}</p>}

        <div className="auth-divider"><span>or</span></div>

        <div className="google-wrap">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google login failed")} />
        </div>

        <p className="auth-foot">
          New here? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
