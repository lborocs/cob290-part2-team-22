import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Employee Components
import EmpNavbar from './employee/EmpNavbar/EmpNavbar';
import EmpTodoList from './employee/EmpTodoList/EmpTodoList';
import EmpHome from './employee/EmpHome/EmpHome';
import EmpProjectsTasks from './employee/EmpProjectsTasks/EmpProjectsTasks';
import EmpForum from './employee/EmpForum/EmpForum';

// Manager Components
import ManNavbar from './manager/ManNavbar/ManNavbar';
import ManHome from './manager/ManHome/ManHome';
import ManEmployees from './manager/ManEmployees/ManEmployees';
import ManProjects from './manager/ManProjects/ManProjects';
import ManTasks from './manager/ManTasks/ManTasks';
import ManForum from './manager/ManForum/ManForum';
import ManTodoList from './manager/ManTodoList/ManTodoList';


function App() {
  // Dummy user variable
  const user = "e"; // Change this to "m" for manager view or "e" for employee view

  return (
    <Router>
      <div className="d-flex">
        {/* Sidebar */}
        {user === "e" ? <EmpNavbar /> : <ManNavbar />}

        {/* Main Content */}
        <div
          className="flex-grow-1"
          style={{ marginLeft: '250px', padding: '20px', minHeight: '100vh' }}
        >
          <Routes>
            {/* Employee Routes */}
            {user === "e" && (
              <>
                <Route path="/" element={<EmpHome />} />
                <Route path="/projects-tasks" element={<EmpProjectsTasks />} />
                <Route path="/forum" element={<EmpForum />} />
                <Route path="/todolist" element={<EmpTodoList />} />
              </>
            )}

            {/* Manager Routes */}
            {user === "m" && (
              <>
                <Route path="/" element={<ManHome />} />
                <Route path="/projects" element={<ManProjects />} />
                <Route path="/tasks" element={<ManTasks />} />
                <Route path="/employees" element={<ManEmployees />} />
                <Route path="/forum" element={<ManForum />} />
                <Route path="/todolist" element={<ManTodoList />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
