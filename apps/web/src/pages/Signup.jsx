import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../lib/api";
import { setAuth } from "../lib/auth";
import "../styles/auth-page.css";

export default function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await signupUser(form);
            setAuth(response);
            navigate("/");
        } catch (err) {
            let message = err.message || "Signup failed";

            try {
                const parsed = JSON.parse(message);
                message = parsed.message || message;
            } catch {
                // keep original message
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-page__card">
                <div className="auth-page__brand">
                    <div className="auth-page__icon">♻</div>
                    <div>
                        <p className="auth-page__eyebrow">Smart Recycle Assistant</p>
                        <h1 className="auth-page__title">Sign Up</h1>
                        <p className="auth-page__subtitle">
                            Create your account to continue.
                        </p>
                    </div>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="auth-form__group">
                        <span>Username</span>
                        <input
                            className="auth-form__input"
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            required
                        />
                    </label>

                    <label className="auth-form__group">
                        <span>Email</span>
                        <input
                            className="auth-form__input"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </label>

                    <label className="auth-form__group">
                        <span>Password</span>
                        <input
                            className="auth-form__input"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            required
                        />
                    </label>

                    {error && <p className="auth-form__error">{error}</p>}

                    <button className="auth-form__submit" type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                </form>

                <p className="auth-page__footer-text">
                    Already have an account?{" "}
                    <Link className="auth-page__link" to="/login">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}