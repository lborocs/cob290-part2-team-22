import React, { useState } from "react";

const LoginForm = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://35.214.101.36/Login.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (data.success) {
                setMessage(`Welcome, ${data.user.name}!`);
                onLoginSuccess(data.user.role, data.user.userId); // Pass the role to App.js
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            setMessage("Error connecting to the server");
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4 shadow-lg text-center" style={{ width: "100%", maxWidth: "400px" }}>
                {/* Company Logo */}
                <img
                    src="/company-logo.png"  // Path to the logo in the public folder
                    alt="Company Logo"
                    className="img-fluid mb-4"
                    style={{ maxWidth: "100%", height: "auto" }}
                />
                <h2 className="mb-4">Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">
                            Username
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                        Login
                    </button>
                    {message && <p className="mt-3 text-danger">{message}</p>}
                </form>
            </div>
        </div>
    );
};

export default LoginForm;
