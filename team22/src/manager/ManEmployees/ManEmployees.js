import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, InputGroup, Dropdown, DropdownButton } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FiEye } from 'react-icons/fi';

const API_URL = 'http://35.214.101.36/ManEmployees.php';
const currentUser = { user_id: 3, role: "Manager", name: "John Manager" };

const ManEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('name');

  // Fetch employees from the backend
  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}?action=getEmployees`);
      const data = await res.json();
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (err) {
      console.error('Error fetching employees', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle filter changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Apply filters to employee list
  useEffect(() => {
    let filtered = employees.filter(emp => 
      emp[filterType].toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchQuery, filterType, employees]);

  return (
    <Container>
      <h1 className="text-center my-4">Manager's Employee Overview</h1>
      
      {/* Unified Search and Filter */}
      <InputGroup className="mb-3">
        <Form.Control 
          type="text" 
          placeholder={`Search by ${filterType}`} 
          value={searchQuery} 
          onChange={handleSearchChange} 
        />
        <DropdownButton
          as={InputGroup.Append}
          variant="outline-secondary"
          title={`Filter by ${filterType}`}
        >
          <Dropdown.Item onClick={() => setFilterType('name')}>Name</Dropdown.Item>
          <Dropdown.Item onClick={() => setFilterType('jobTitle')}>Job Title</Dropdown.Item>
          <Dropdown.Item onClick={() => setFilterType('skills')}>Skills</Dropdown.Item>
          <Dropdown.Item onClick={() => setFilterType('team')}>Team</Dropdown.Item>
        </DropdownButton>
      </InputGroup>

      {/* Employee Table */}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Job Title</th>
            <th>Skills</th>
            <th>Team</th>
            <th>Tasks Assigned</th>
            <th>Tasks Completed</th>
            <th>Projects Assigned</th>
            <th>Projects Completed</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map(emp => (
            <tr key={emp.user_id}>
              <td>{emp.user_id}</td>
              <td>{emp.name}</td>
              <td>{emp.jobTitle}</td>
              <td>{emp.skills}</td>
              <td>{emp.team}</td>
              <td>{emp.tasksAssigned}</td>
              <td>{emp.tasksCompleted}</td>
              <td>{emp.projectsAssigned}</td>
              <td>{emp.projectsCompleted}</td>
              <td>
                <Button variant="info" size="sm" onClick={() => setSelectedEmployee(emp) || setShowModal(true)}>
                  <FiEye /> View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {/* Employee Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Employee Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmployee && (
            <div>
              <p><strong>Name:</strong> {selectedEmployee.name}</p>
              <p><strong>Job Title:</strong> {selectedEmployee.jobTitle}</p>
              <p><strong>Skills:</strong> {selectedEmployee.skills}</p>
              <p><strong>Team:</strong> {selectedEmployee.team}</p>
              <p><strong>Tasks Assigned:</strong> {selectedEmployee.tasksAssigned}</p>
              <p><strong>Tasks Completed:</strong> {selectedEmployee.tasksCompleted}</p>
              <p><strong>Projects Assigned:</strong> {selectedEmployee.projectsAssigned}</p>
              <p><strong>Projects Completed:</strong> {selectedEmployee.projectsCompleted}</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ManEmployees;
