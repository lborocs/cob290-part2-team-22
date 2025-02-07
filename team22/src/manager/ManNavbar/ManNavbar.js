import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';

const ManNavbar = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [step, setStep] = useState("currentPassword");
  const navigate = useNavigate();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prevData => ({ ...prevData, [name]: value }));
  };

  const validateNewPassword = (password) => {
    return password.length >= 8 && /[^a-zA-Z0-9]/.test(password);
  };

  const handleCurrentPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://your-server-ip/Navbar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "verifyPassword",
          currentPassword: passwordData.currentPassword
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setStep("newPassword");
      } else {
        alert("Incorrect current password.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to verify password.");
    }
  };

  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validateNewPassword(passwordData.newPassword)) {
      alert("New password must be at least 8 characters long and contain at least one special character.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      const response = await fetch('http://your-server-ip/Navbar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "changePassword",
          newPassword: passwordData.newPassword
        })
      });

      const result = await response.json();
      alert(result.message);
      if (response.ok) {
        setActiveModal(null);
        setStep("currentPassword");
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to change password.");
    }
  };

  const handleLogout = () => {
    setShowSettings(false);
    navigate('/LoginForm');
  };

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
            <Link to="/" className="nav-link text-white">Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/projects" className="nav-link text-white">Projects</Link>
          </li>
          <li className="nav-item">
            <Link to="/tasks" className="nav-link text-white">Tasks</Link>
          </li>
          <li className="nav-item">
            <Link to="/employees" className="nav-link text-white">Employees</Link>
          </li>
        </ul>
      </div>

      {/* Settings Button */}
      <div className="px-3 pb-3">
        <Button variant="link" className="nav-link text-white" onClick={() => setShowSettings(true)}>
          Settings
        </Button>
      </div>

      {/* Settings Modal */}
      <Modal show={showSettings} onHide={() => setShowSettings(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Button variant="warning" className="w-100 mb-2" onClick={() => setActiveModal("changePassword")}>
            Change Password
          </Button>
          <Button variant="danger" className="w-100" onClick={() => setActiveModal("logOut")}>
            Log Out
          </Button>
        </Modal.Body>
      </Modal>

      {/* Change Password Modal */}
      <Modal show={activeModal === "changePassword"} onHide={() => setActiveModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {step === "currentPassword" ? (
            <Form onSubmit={handleCurrentPasswordSubmit}>
              <Form.Group>
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit" className="mt-3">Next</Button>
            </Form>
          ) : (
            <Form onSubmit={handleNewPasswordSubmit}>
              <Form.Group>
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmNewPassword"
                  value={passwordData.confirmNewPassword}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit" className="mt-3">Change Password</Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal show={activeModal === "logOut"} onHide={() => setActiveModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to log out?</p>
          <Button variant="danger" onClick={handleLogout}>Confirm</Button>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ManNavbar;
