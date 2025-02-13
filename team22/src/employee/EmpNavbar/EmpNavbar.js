import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown, Button, Form, Modal, Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';

const ManNavbar = ({ setUserRole, setUserId, userId }) => {
  const [step, setStep] = useState("currentPassword");
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);  
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [job_title, setJobTitle] = useState('');

  // Fetch user details when userId changes
  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  // Fetch user details from the server
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

  // State for password change form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Handle input changes in the password form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Validate new password
  const validateNewPassword = (password) => {
    return password.length >= 8 && /[^a-zA-Z0-9]/.test(password);
  };

  // Handle current password submission
  const handleCurrentPasswordSubmit = async (e) => {
    e.preventDefault();

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

  // Handle new password submission
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

  // Handle logout
  const handleLogout = () => {
    setUserRole(null);
    setUserId(null);
    navigate("/");
  };

  // Reset step and clear password fields when profile modal is shown
  const handleProfileModalShow = () => {
    setShowProfileModal(true);
    setStep("currentPassword");
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  };

  // Clear password fields when modal is hidden
  const handleProfileModalHide = () => {
    setShowProfileModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  };

 // Function to close the dropdown and collapse navbar when a link is clicked
 const closeDropdown = () => {
  if (window.innerWidth <= 992) {
    setDropdownOpen(false); 
    setIsNavbarOpen(false);
  }
};
return (
  <div>
    {/* Top Navbar */}
    <Navbar expand="lg" bg="dark" variant="dark" fixed="top" className="custom-navbar">
      <Container fluid>
        {/* Company Logo */}
        <Navbar.Brand as={Link} to="/" className="me-auto">
          <img
            src="/company-logo.png"
            alt="Company Logo"
            className="company-logo"
          />
        </Navbar.Brand>

        {/* Hamburger Menu */}
        <Navbar.Toggle
          aria-controls="navbar-nav"
          className="ms-auto"
          onClick={() => setIsNavbarOpen(!isNavbarOpen)} 
        />

        {/* Navbar Links */}
        <Navbar.Collapse id="navbar-nav" in={isNavbarOpen}> {/* Collapse based on state */}
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className="text-white" onClick={closeDropdown}>
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/projects-tasks" className="text-white" onClick={closeDropdown}>
              Projects/Tasks
            </Nav.Link>
            <Nav.Link as={Link} to="/todolist" className="text-white" onClick={closeDropdown}>
              TodoList
            </Nav.Link>
            <Nav.Link as={Link} to="/forum" className="text-white" onClick={closeDropdown}>
              Forum
            </Nav.Link>
          </Nav>

             {/* Profile Dropdown */}
             <Nav className="ms-auto">
              <NavDropdown
                title={`Employee: ${name}`}
                align="end"
                className="profile-dropdown"
                show={dropdownOpen}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <NavDropdown.Item onClick={handleProfileModalShow}>Profile</NavDropdown.Item>
                <NavDropdown.Item onClick={() => setShowLogoutConfirmation(true)}>Log Out</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>


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
          ..company-logo {
            height: 45px;
            padding-right: 30px;
          }

          .navbar-nav .nav-link {
            font-size: 18px;
            padding: 13px 25px;
            margin-right: 20px;
            transition: color 0.3s ease-in-out;
          }

          .navbar-nav .nav-link:hover {
            color: #f8b400 !important;
          }

          .navbar-toggler:hover {
            outline: 2px solid #f8b400;
          }
            
          .navbar-toggler:focus {
            outline: none;
            box-shadow: none; 
          }

          .profile-dropdown .dropdown-menu {
            background-color: #212529;
            border: none;
            min-width: 180px;
          }

          .profile-dropdown .dropdown-item {
            color: #f8f9fa;
            font-size: 16px;
            padding: 10px 15px;
            transition: color 0.3s ease-in-out, border-color 0.3s ease-in-out;
            border: 2px solid transparent;
            background-color: transparent;
          }

          .profile-dropdown .dropdown-item:hover {
            color: #f8b400; 
            background-color: transparent; 
          }

          @media (max-width: 992px) {
            .profile-dropdown {
              width: 100%;
              text-align: left; 
            }

            .profile-dropdown .dropdown-menu {
              width: 100%;
              text-align: center;
            }
        `}
      </style>
    </div>
  );
};

export default ManNavbar;