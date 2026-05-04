import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../lib/api";
import { setAuth } from "../lib/auth";
import "../styles/auth-page.css";

export default function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
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
            const response = await loginUser(form);
            setAuth(response);
            navigate("/");
        } catch (err) {
            setError(err.message || "Login failed");
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
                        <h1 className="auth-page__title">Login</h1>
                        <p className="auth-page__subtitle">
                            Sign in to use Smart Recycle Assistant.
                        </p>
                    </div>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
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
                            placeholder="Enter your password"
                            required
                        />
                    </label>

                    {error && <p className="auth-form__error">{error}</p>}

                    <button className="auth-form__submit" type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="auth-page__footer-text">
                    No account?{" "}
                    <Link className="auth-page__link" to="/signup">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}