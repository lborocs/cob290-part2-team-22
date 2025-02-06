import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  // Function to validate password strength
  const validatePassword = (password) => {
    return /^(?=.*[^a-zA-Z0-9]).{8,}$/.test(password);
  };
  
  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!username.endsWith('@make-it-all.co.uk')) {
      setMessage('Username must end with @make-it-all.co.uk');
      return;
    }

    if (!validatePassword(password)) {
      setMessage('Password must be at least 8 characters long and contain a special character.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const response = await fetch("http://35.214.101.36/Register.php", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Registration successful. You can now log in.');
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage('Error connecting to the server.');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-lg text-center" style={{ width: '100%', maxWidth: '400px' }}>
        <img src="/company-logo.png" alt="Company Logo" className="img-fluid mb-4" />
        <h2 className="mb-4">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input 
              type="email" 
              className="form-control" 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Enter username"
              required 
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter a strong password"
              required 
            />
          </div>
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input 
              type="password" 
              className="form-control" 
              id="confirmPassword" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Confirm your password"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Register</button>
          {message && <p className="mt-3 text-danger">{message}</p>}
        </form>
        <p className="mt-3">Have an account? <Link to="/">Login</Link></p>
      </div>
    </div>
  );
};

export default RegisterForm;
