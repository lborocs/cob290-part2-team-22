import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown, Button, Form, Modal } from 'react-bootstrap';

const ManNavbar = ({ setUserRole, setUserId, userId }) => {
  const [step, setStep] = useState("currentPassword");
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // State for profile modal
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [job_title, setJobTitle] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch("http://35.214.101.36/Navbar.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fetchUser: true,
          userId: userId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUsername(result.user.username);
        setRole(result.user.role);
        setName(result.user.name);
        setJobTitle(result.user.job_title);
      } else {
        console.error("Failed to fetch user details:", result.message);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prevData) => ({ ...prevData, [name]: value }));
  };

  const validateNewPassword = (password) => {
    return password.length >= 8 && /[^a-zA-Z0-9]/.test(password);
  };

  const handleCurrentPasswordSubmit = async (e) => {
    e.preventDefault();

    console.log("DEBUG: Verifying password for userId:", userId);

    try {
      const response = await fetch("http://35.214.101.36/Navbar.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          currentPassword: passwordData.currentPassword,
        }),
      });

      const result = await response.json();
      console.log("DEBUG: API response:", result);

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

    const { newPassword, confirmNewPassword } = passwordData;

    if (!validateNewPassword(newPassword)) {
      alert("Password must be at least 8 characters long and contain at least one special character.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert("New passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://35.214.101.36/Navbar.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: String(userId),
          newPassword: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Server error");

      if (result.success) {
        alert("Password successfully updated.");
        setStep("currentPassword");
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      } else {
        alert(result.message || "Failed to update password.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error updating password: " + error.message);
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setUserId(null);
    navigate("/");
  };

  // Reset step to "currentPassword" and clear password fields when profile modal is shown
  const handleProfileModalShow = () => {
    setShowProfileModal(true);
    setStep("currentPassword"); // Reset step to "currentPassword"
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); // Clear password fields
  };

  // Clear password fields when modal is exited
  const handleProfileModalHide = () => {
    setShowProfileModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); // Clear password fields
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
        <h3 className="text-center py-3">Employee Sidebar</h3>
        <ul className="nav flex-column px-3">
          <li className="nav-item">
            <Link to="/" className="nav-link text-white hover-effect">
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/projects-tasks" className="nav-link text-white hover-effect">
              Projects/tasks
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/todolist" className="nav-link text-white hover-effect">
              TodoList
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/forum" className="nav-link text-white hover-effect">
              Forum
            </Link>
          </li>
        </ul>
      </div>
      <div className="px-3 pb-3">
        <Dropdown drop="up" align="end">
          <Dropdown.Toggle variant="link" className="nav-link text-white hover-effect">
            {name}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={handleProfileModalShow}>Profile</Dropdown.Item>
            <Dropdown.Item onClick={() => setShowLogoutConfirmation(true)}>Log Out</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Profile Modal */}
      <Modal show={showProfileModal} onHide={handleProfileModalHide}>
        <Modal.Header closeButton>
          <Modal.Title>Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" value={username} readOnly />
            </Form.Group>
            <Form.Group>
              <Form.Label>Role</Form.Label>
              <Form.Control type="text" value={role} readOnly />
            </Form.Group>
            <Form.Group>
              <Form.Label>Job Title</Form.Label>
              <Form.Control type="text" value={job_title} readOnly />
            </Form.Group>
          </Form>

          {/* Change Password Section */}
          <h5 className="mt-4">Change Password</h5>
          {step === "currentPassword" && (
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
              <Button variant="primary" type="submit" className="mt-3">
                Verify Password
              </Button>
            </Form>
          )}

          {step === "newPassword" && (
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
              <Button variant="primary" type="submit" className="mt-3">
                Change Password
              </Button>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleProfileModalHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal show={showLogoutConfirmation} onHide={() => setShowLogoutConfirmation(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to log out?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutConfirmation(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            Log Out
          </Button>
        </Modal.Footer>
      </Modal>

      <style>
        {`
          .hover-effect:hover {
            background-color: #343a40; /* Darker background on hover */
            color: #fff !important; /* Ensure text color stays white */
            text-decoration: none; /* Remove underline on hover */
          }
        `}
      </style>
    </div>
  );
};

export default ManNavbar;