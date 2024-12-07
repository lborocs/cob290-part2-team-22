import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Login Component
import LoginForm from './login pages/LoginForm';

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
  const [userRole, setUserRole] = useState(null); // Track logged-in user role

  return (
    <Router>
      {userRole ? (
        <div className="d-flex">
          {/* Sidebar */}
          {userRole === "Employee" ? <EmpNavbar /> : <ManNavbar />}

          {/* Main Content */}
          <div
            className="flex-grow-1"
            style={{ marginLeft: '250px', padding: '20px', minHeight: '100vh' }}
          >
            <Routes>
              {/* Employee Routes */}
              {userRole === "Employee" && (
                <>
                  <Route path="/" element={<EmpHome />} />
                  <Route path="/projects-tasks" element={<EmpProjectsTasks />} />
                  <Route path="/forum" element={<EmpForum />} />
                  <Route path="/todolist" element={<EmpTodoList />} />
                </>
              )}

              {/* Manager Routes */}
              {userRole === "Manager" && (
                <>
                  <Route path="/" element={<ManHome />} />
                  <Route path="/projects" element={<ManProjects />} />
                  <Route path="/tasks" element={<ManTasks />} />
                  <Route path="/employees" element={<ManEmployees />} />
                  <Route path="/forum" element={<ManForum />} />
                  <Route path="/todolist" element={<ManTodoList />} />
                </>
              )}

              {/* Redirect unknown routes */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      ) : (
        // Show login form if not logged in
        <Routes>
          <Route
            path="/"
            element={<LoginForm onLoginSuccess={(role) => setUserRole(role)} />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
