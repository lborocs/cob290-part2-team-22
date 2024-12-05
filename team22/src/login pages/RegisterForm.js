import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterForm = () => {
  // State to store user input
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Function to handle validating registration submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if(!username.endsWith('make-it-all.co.uk')) {
        alert('This is an invalid username please try again');
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
  }  
    return (
    <div className='wrapper'>
      <form onSubmit={handleSubmit}>
        <img src='./CompanyLogo.png' alt='Company Logo' />
        <h1>Register</h1>
        <div className="input-box">
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div className="input-box">
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="input-box">
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">Register</button>
        <div className='already-have-account'>
          <Link to='/'>Have an account? Login</Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;