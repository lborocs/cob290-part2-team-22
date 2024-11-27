import React from 'react';
import './App.css';
import EmpTodoList from './employee/todolist/EmpTodoList';
import Empnavbar from './employee/Empnavbar/Empnavbar';

function App() {
  return (
    <div className="d-flex">
      {/* Sidebar on the left */}
      <Empnavbar />

      {/* Main Content */}
      <div
        className="flex-grow-1 d-flex justify-content-center"
        style={{ marginLeft: "250px", paddingTop: "20px", minHeight: "100vh" }}
      >
        <EmpTodoList />
      </div>
    </div>
  );
}

export default App;
