import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown, Button, Form, Modal, Navbar, Nav, NavDropdown, Container, Row, Col} from 'react-bootstrap';

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
      <Navbar expand="lg" className="custom-navbar" fixed="top">
      <Container fluid>
          {/* Company Logo */}
          <Navbar.Brand as={Link} to="/" className="me-auto">
            <img
              src="/company-logo2.png"
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
              <Nav.Link as={Link} to="/" className="text-black" onClick={closeDropdown}>
                Home
              </Nav.Link>
              <Nav.Link as={Link} to="/projects" className="text-black" onClick={closeDropdown}>
                Projects
              </Nav.Link>
              <Nav.Link as={Link} to="/tasks" className="text-black" onClick={closeDropdown}>
                Tasks
              </Nav.Link>
              <Nav.Link as={Link} to="/employees" className="text-black" onClick={closeDropdown}>
                Employees
              </Nav.Link>
              <Nav.Link as={Link} to="/todolist" className="text-black" onClick={closeDropdown}>
                TodoList
              </Nav.Link>
              <Nav.Link as={Link} to="/forum" className="text-black" onClick={closeDropdown}>
                Forum
              </Nav.Link>
            </Nav>

            {/* Profile Dropdown */}
            <Nav className="auto">
              <NavDropdown
                title={`${name}`}
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
      <Modal show={showProfileModal} onHide={handleProfileModalHide} backdrop="static" keyboard={false} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">My Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="profile-container p-3">
            

            <hr />

            {/* Profile Details */}
            <div className="profile-details">
              <Row className="mb-3">
                <Col xs={4} className="fw-bold text-dark profile-label">Username:</Col>
                <Col xs={8} className="profile-value">{username}</Col>
              </Row>
              <Row className="mb-3">
                <Col xs={4} className="fw-bold text-dark profile-label">Role:</Col>
                <Col xs={8} className="profile-value">{role}</Col>
              </Row>
              <Row className="mb-3">
                <Col xs={4} className="fw-bold text-dark profile-label">Job Title:</Col>
                <Col xs={8} className="profile-value">{job_title}</Col>
              </Row>
            </div>
            <hr />

            {/* Change Password Section */}
            <h5 className="fw-bold text-dark">Change Password</h5>
            <p className="text-muted">For security reasons, please update your password regularly.</p>
            {step === "currentPassword" && (
              <Form onSubmit={handleCurrentPasswordSubmit}>
                <Form.Group>
                  <Form.Label className="fw-bold">Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-3 w-100">
                  Verify Password
                </Button>
              </Form>
            )}

            {step === "newPassword" && (
              <Form onSubmit={handleNewPasswordSubmit}>
                <Form.Group>
                  <Form.Label className="fw-bold">New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label className="fw-bold">Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmNewPassword"
                    value={passwordData.confirmNewPassword}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                <Button variant="success" type="submit" className="mt-3 w-100">
                  Update Password
                </Button>
              </Form>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleProfileModalHide} className="w-100">
            Close
          </Button>
        </Modal.Footer>

        {/* Custom Styling */}
        <style>
          {`
            .profile-container {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
            }
            .profile-details p {
              font-size: 16px;
              margin-bottom: 10px;
            }
            .text-secondary {
              font-size: 14px;
            }
          `}
        </style>
      </Modal>


      {/* Logout Confirmation Modal */}
      <Modal show={showLogoutConfirmation} onHide={() => setShowLogoutConfirmation(false)} backdrop="static" keyboard={false}>
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
        .company-logo {
          height: 45px;
          padding-right: 30px;
        }
        .custom-navbar {
          background-color: rgb(232, 232, 236) !important;
          border-bottom: 2px solid #f8b400;
        }
        .navbar-nav .nav-link {
          color: black !important;
          font-size: 18px;
          padding: 13px 25px;
          margin-right: 20px;
          transition: color 0.3s ease-in-out;
        }

        .navbar-nav .nav-link:hover {
          color: #f8b400 !important;
        }

        /* Change the hamburger icon to black */
        .navbar-toggler-icon {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Cpath stroke='black' stroke-width='2' stroke-linecap='round' stroke-miterlimit='10' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
        }

        .navbar-toggler:hover {
          outline: 2px solid #f8b400;
        }

        .navbar-toggler:focus {
          outline: none;
          box-shadow: none;
        }

        /* Dropdown menu styling */
        .profile-dropdown .dropdown-menu {
          border: 2px solid #f8b400 !important; /* Ensure the border is applied */
          min-width: 180px;
          background-color: rgb(232, 232, 236) !important; /* Match the navbar's background color */
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Optional: Add a shadow for better visibility */
        }

        /* Dropdown items styling */
        .profile-dropdown .dropdown-item {
          color: black;
          font-size: 16px;
          padding: 10px 15px;
          transition: color 0.3s ease-in-out;
          background-color: transparent; /* Ensure no background color */
        }

        .profile-dropdown .dropdown-item:hover {
          color: #f8b400 !important; /* Only change the text color to orange on hover */
          background-color: transparent !important; /* Ensure no background color on hover */
        }

        /* Ensure dropdown menu is visible and properly styled on mobile */
        @media (max-width: 992px) {
          .profile-dropdown {
            width: 100%;
            text-align: left;
          }

          .profile-dropdown .dropdown-menu {
            width: 100%;
            text-align: center;
            border: 2px solid #f8b400 !important; /* Ensure border is applied on mobile */
            background-color: rgb(232, 232, 236) !important; /* Match the navbar's background color on mobile */
          }
        }
      `}
    </style>
    </div>
  );
};

export default ManNavbar;