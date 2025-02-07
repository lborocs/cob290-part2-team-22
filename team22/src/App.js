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


// Manager Components
import ManNavbar from './manager/ManNavbar/ManNavbar';
import ManHome from './manager/ManHome/ManHome';
import ManEmployees from './manager/ManEmployees/ManEmployees';
import ManProjects from './manager/ManProjects/ManProjects';
import ManTasks from './manager/ManTasks/ManTasks';
import ManForum from './manager/ManForum/ManForum';

function App() {
  const [userRole, setUserRole] = useState(null); // Track logged-in user role
  const [userId, setUserId] = useState(null); // Track logged-in user ID

  return (
    <Router>
      {userRole ? (
        <div className="d-flex">
          {/* Sidebar */}
          {userRole === "Manager" ? (
            <ManNavbar setUserRole={setUserRole} setUserId={setUserId} />
          ) : (
            <EmpNavbar setUserRole={setUserRole} setUserId={setUserId} />
          )}

          {/* Main Content */}
          <div
            className="flex-grow-1"
            style={{ marginLeft: '250px', padding: '20px', minHeight: '100vh' }}
          >
            <Routes>
              {/* Employee Routes */}
              {userRole === "Employee" && (
                <>
                  <Route path="/" element={<EmpHome userId={userId} userRole={userRole} />} />
                  <Route path="/projects-tasks" element={<EmpProjectsTasks />} />
                  <Route path="/forum/*" element={<EmpForum userId={userId} />} />
                  <Route path="/todolist" element={<TodoList userId={userId} />} />

                </>
              )}

              {/* Manager Routes */}
              {userRole === "Manager" && (
                <>
                  <Route path="/" element={<ManHome userId={userId} userRole={userRole} />} />
                  <Route path="/projects" element={<ManProjects />} />
                  <Route path="/tasks" element={<ManTasks />} />
                  <Route path="/employees" element={<ManEmployees />} />
                  <Route path="/forum/*" element={<ManForum userId={userId} />} />
                  <Route path="/todolist" element={<TodoList userId={userId} />} />
                  <Route path="/login" element={<LoginForm />} />
                </>
              )}

               {/* Team Leader Routes */}
               {userRole === "Team Leader" && (
                <>
                  <Route path="/" element={<EmpHome userId={userId} userRole={userRole} />} />
                  <Route path="/projects-tasks" element={<EmpProjectsTasks />} />
                  <Route path="/forum/*" element={<EmpForum userId={userId} />} />
                  <Route path="/todolist" element={<TodoList userId={userId} />} />
                  <Route path="/login" element={<LoginForm />} />
                </>
              )}

              {/* Redirect unknown routes */}
              <Route path="*" element={<Navigate to={userRole ? "/" : "/login"} />} />
            </Routes>
          </div>
        </div>
      ) : (
        // When there is no user role, shows this (when program starts)
        <Routes>
          <Route path="/" element={<LoginForm onLoginSuccess={(role, id) => {
            setUserRole(role); setUserId(id);}} />}
          />
          
        </Routes>
        
      )}
    </Router>
  );
}

export default App;
