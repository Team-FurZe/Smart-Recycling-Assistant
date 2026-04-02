import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../lib/api";
import { setAuth } from "../lib/auth";

export default function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await signupUser(form);
            setAuth(response);

            alert("Signup successful. Welcome to Smart Recycle Assistant.");

            navigate("/");
        } catch (err) {
            let message = err.message || "Signup failed";

            try {
                const parsed = JSON.parse(message);
                message = parsed.message || message;
            } catch {
            }

            alert(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Sign Up</h1>
                <p>Create your account to continue.</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        value={form.fullName}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                </form>

                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}