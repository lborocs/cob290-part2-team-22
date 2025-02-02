import React from "react";
import { Link } from 'react-router-dom';

const EmpNavbar = () => {
  return (
    <div
      className="bg-dark text-white vh-100"
      style={{
        width: "250px",
        position: "fixed",
        top: "0",
        left: "0",
        height: "100vh",
        overflowY: "auto",
      }}
    >
      <h3 className="text-center py-3">Employee Sidebar</h3>
      <ul className="nav flex-column px-3">
        <li className="nav-item">
          <Link
            to="/"
            className="nav-link text-white"
            style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            Home
          </Link>
        </li>
        <li className="nav-item">
          <Link
            to="/projects-tasks"
            className="nav-link text-white"
            style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            Projects/Tasks
          </Link>
        </li>
        <li className="nav-item">
          <Link
            to="/forum"
            className="nav-link text-white"
            style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            Forum
          </Link>
        </li>
        <li className="nav-item">
          <Link
            to="/todolist"
            className="nav-link text-white"
            style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            Todolist
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default EmpNavbar;
