import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginForm = () => {
    // Store user input
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // User Details
  const user1 = {username: 'james@make-it-all.co.uk', password: 'password1' };
  const user2 = {username: 'emma@make-it-all.co.uk', password: 'password2' };
  

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // If statement to authenticate input
    if (username === user1.username && password === user1.password) {
        alert('Manager has logged in');
        navigate('/dashboard');
      }
      // Check for employee credentials
      else if (username === user2.username && password === user2.password) {
        alert('Employee has logged in');
        navigate('/todolist');
      }
      // Incorrect credentials
      else {
        alert('Login Details Are Incorrect');
      }

    
};
    return (
      
    <div className='wrapper'>
        <form onSubmit={handleSubmit}>
            <img src='./CompanyLogo.png' alt='CompanyImage'></img>
            <h1>Login</h1>
            <div className="input-box">
                <input type="text" placeholder='Username' value={username} onChange={(e) => setUsername(e.target.value)} required/>

            </div>
            <div className="input-box">
                <input type='password' placeholder='Password' value={password}
            onChange={(e) => setPassword(e.target.value)} required/>

            </div>
            <div className='forgot-password'>
                <Link to='/register'>Register</Link>
            </div>
            <button type='submit'>Login</button>

        </form>
      </div>
    
  );
};

export default LoginForm;
