import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Empnavbar = () => {
  return (
    <div
      className="bg-dark text-white vh-100"
      style={{
        width: "250px", // Adjusted sidebar width
        position: "fixed",
        top: "0",
        left: "0",
        height: "100vh",
        overflowY: "auto",
      }}
    >
      <h3 className="text-center py-3">Sidebar</h3>
      <ul className="nav flex-column px-3">
        <li className="nav-item">
          <a
            href="#home"
            className="nav-link text-white"
            style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            Home
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#projects-tasks"
            className="nav-link text-white"
            style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            Projects/Tasks
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#forum"
            className="nav-link text-white"
            style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            Forum
          </a>
        </li>
        <li className="nav-item">
          <a
            href="#todolist"
            className="nav-link text-white"
            style={{ padding: "10px 15px" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#495057")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          >
            Todolist
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Empnavbar;
