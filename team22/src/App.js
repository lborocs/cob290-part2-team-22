import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Login Component
import LoginForm from './login pages/LoginForm';

// Todo List Component (same for employees and managers)
import TodoList from './TodoList pages/TodoList';

// Employee Components
import EmpNavbar from './employee/EmpNavbar/EmpNavbar';
import EmpHome from './employee/EmpHome/EmpHome';
import EmpProjectsTasks from './employee/EmpProjectsTasks/EmpProjectsTasks';
import EmpForum from './employee/EmpForum/EmpForum';
import EmpSettings from './employee/EmpSettings/EmpSettings';


// Manager Components
import ManNavbar from './manager/ManNavbar/ManNavbar';
import ManHome from './manager/ManHome/ManHome';
import ManEmployees from './manager/ManEmployees/ManEmployees';
import ManProjects from './manager/ManProjects/ManProjects';
import ManTasks from './manager/ManTasks/ManTasks';
import ManForum from './manager/ManForum/ManForum';
import ManSettings from './manager/ManSettings/ManSettings';

function App() {
  const [userRole, setUserRole] = useState(null); // Track logged-in user role
  const [userId, setUserId] = useState(null); // Track logged-in user ID

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
                  <Route path="/" element={<EmpHome userId={userId} />} />
                  <Route path="/projects-tasks" element={<EmpProjectsTasks />} />
                  <Route path="/forum/*" element={<EmpForum userId={userId} />} />
                  <Route path="/todolist" element={<TodoList userId={userId} />} />
                  <Route path="/settings" element={<TodoList userId={userId} />} />
                </>
              )}

              {/* Manager Routes */}
              {userRole === "Manager" && (
                <>
                  <Route path="/" element={<ManHome />} />
                  <Route path="/projects" element={<ManProjects />} />
                  <Route path="/tasks" element={<ManTasks />} />
                  <Route path="/employees" element={<ManEmployees />} />
                  <Route path="/forum/*" element={<ManForum userId={userId} />} />
                  <Route path="/todolist" element={<TodoList userId={userId} />} />
                  <Route path="/settings" element={<TodoList userId={userId} />} />
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
            element={<LoginForm onLoginSuccess={(role, id) => {
              setUserRole(role);
              setUserId(id);
            }} />
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
