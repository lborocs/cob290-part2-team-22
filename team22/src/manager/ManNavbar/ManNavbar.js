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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <h3 className="text-center py-3">Manager Sidebar</h3>
        <ul className="nav flex-column px-3">
          <li className="nav-item">
            <Link to="/" className="nav-link text-white" style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/projects" className="nav-link text-white" style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}>
              Projects
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/tasks" className="nav-link text-white" style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}>
              Tasks
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/employees" className="nav-link text-white" style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}>
              Employees
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/forum" className="nav-link text-white" style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}>
              Forum
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/todolist" className="nav-link text-white" style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}>
              Todo List
            </Link>
          </li>
        </ul>
      </div>
      <div className="px-3 pb-3">
        <Link to="/settings" className="nav-link text-white" style={{ padding: "10px 15px" }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
        onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}>
        Settings
        </Link>
      </div>
    </div>
  );
};

export default ManNavbar;