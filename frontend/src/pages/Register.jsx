import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const [email, setEmail] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const passwordRule = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

    if (!passwordRule.test(password)) {
      setError("Password must be at least 8 characters and include both letters and numbers");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password must match");
      return;
    }

    const parsedHeight = Number(heightCm);
    const parsedWeight = Number(weightKg);

    if (!Number.isFinite(parsedHeight) || parsedHeight < 80 || parsedHeight > 260) {
      setError("Height must be between 80 and 260 cm");
      return;
    }

    if (!Number.isFinite(parsedWeight) || parsedWeight < 20 || parsedWeight > 400) {
      setError("Weight must be between 20 and 400 kg");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", { email, password, heightCm: parsedHeight, weightKg: parsedWeight });
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="panel panel--auth">
        <h1 className="brand">MoodEats 🍔</h1>
        <p className="subtitle">Create your account ✨<br />Start discovering cravings.</p>
        <img className="auth-hero" src="/fresh-bowl.svg" alt="Fresh ingredients illustration" />
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
          <input
            className="input"
            type="number"
            min="80"
            max="260"
            placeholder="Height (cm)"
            value={heightCm}
            onChange={(event) => setHeightCm(event.target.value)}
          />
          <input
            className="input"
            type="number"
            min="20"
            max="400"
            placeholder="Weight (kg)"
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create one"}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <p className="auth-foot">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
