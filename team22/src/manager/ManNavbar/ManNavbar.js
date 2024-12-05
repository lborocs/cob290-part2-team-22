import React from 'react';
import { Link } from 'react-router-dom';

const ManNavbar = () => {
  return (
    <div
      className="bg-dark text-white vh-100"
      style={{
        width: '250px',
        position: 'fixed',
        top: '0',
        left: '0',
        overflowY: 'auto',
      }}
    >
      <h3 className="text-center py-3">Manager Sidebar</h3>
      <ul className="nav flex-column px-3">
        <li className="nav-item">
          <Link to="/" className="nav-link text-white" style={{ padding: '10px 15px' }}>
            Home
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/projects" className="nav-link text-white" style={{ padding: '10px 15px' }}>
            Projects
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/tasks" className="nav-link text-white" style={{ padding: '10px 15px' }}>
            Tasks
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/employees" className="nav-link text-white" style={{ padding: '10px 15px' }}>
            Employees
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/forum" className="nav-link text-white" style={{ padding: '10px 15px' }}>
            Forum
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/todolist" className="nav-link text-white" style={{ padding: '10px 15px' }}>
            Todo List
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default ManNavbar;
