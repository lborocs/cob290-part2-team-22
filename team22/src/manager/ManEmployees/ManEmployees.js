import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, InputGroup, Dropdown, DropdownButton, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FiEye } from 'react-icons/fi';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const API_URL = 'http://35.214.101.36/ManEmployees.php';
const currentUser = { user_id: 3, role: "Manager", name: "John Manager" };

const ManEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('name');
  const [sortType, setSortType] = useState(null);
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editSkills, setEditSkills] = useState('');

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

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter and sort employees based on search query, filter type, and sort type
  useEffect(() => {
    let filtered = employees.filter(emp => 
      emp[filterType]?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sortType === 'tasksAssigned') {
      filtered.sort((a, b) => b.tasksAssigned - a.tasksAssigned);
    }
    setFilteredEmployees(filtered);
  }, [searchQuery, filterType, employees, sortType]);

  // Show modal and set selected employee data
  const handleShowModal = (emp) => {
    setSelectedEmployee(emp);
    setEditJobTitle(emp.job_title);
    setEditSkills(emp.skills);
    setShowModal(true);
  };

  // Save changes to the backend
  const handleSaveChanges = async () => {
    if (!selectedEmployee) return;
    try {
      const response = await fetch(`${API_URL}?action=updateEmployee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedEmployee.user_id,
          job_title: editJobTitle,
          skills: editSkills,
        }),
      });

      if (response.ok) {
        // Refresh the employee list after updating
        fetchEmployees();
        setShowModal(false);
      } else {
        console.error('Failed to update employee');
      }
    } catch (err) {
      console.error('Error updating employee', err);
    }
  };

  // Process data for the skills distribution pie chart
  const processSkillsData = () => {
    const skillCounts = {};
    employees.forEach(emp => {
      if (emp.skills) {
        emp.skills.split(', ').forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      }
    });
    return {
      labels: Object.keys(skillCounts),
      datasets: [{
        data: Object.values(skillCounts),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#FF5722', '#9C27B0'],
      }]
    };
  };

  // Process data for the task allocation bar chart
  const processTaskData = () => {
    const topEmployees = [...employees]
      .sort((a, b) => b.tasksAssigned - a.tasksAssigned)
      .slice(0, 5);

    return {
      labels: topEmployees.map(emp => emp.name),
      datasets: [{
        label: "Tasks Assigned",
        data: topEmployees.map(emp => emp.tasksAssigned),
        backgroundColor: topEmployees.map(emp => emp.tasksAssigned > 7 ? '#FF5733' : '#36A2EB'),
      }]
    };
  };

  return (
    <Container>
      <h1 className="text-center my-4">Manager's Employee Overview</h1>

      {/* Search, Filter, and Sort Bar */}
      <InputGroup className="mb-3">
        <Form.Control
          type="text"
          placeholder={`Search by ${filterType}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <DropdownButton as={InputGroup.Append} variant="outline-secondary" title={`Filter by ${filterType}`}>
          <Dropdown.Item onClick={() => setFilterType('name')}>Name</Dropdown.Item>
          <Dropdown.Item onClick={() => setFilterType('job_title')}>Job Title</Dropdown.Item>
          <Dropdown.Item onClick={() => setFilterType('skills')}>Skills</Dropdown.Item>
        </DropdownButton>
        <DropdownButton as={InputGroup.Append} variant="outline-secondary" title="Sort By">
          <Dropdown.Item onClick={() => setSortType(null)}>Default</Dropdown.Item>
          <Dropdown.Item onClick={() => setSortType('tasksAssigned')}>Most Tasks Assigned</Dropdown.Item>
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
            <th>Tasks Assigned</th>
            <th>Tasks Completed</th>
            <th>Projects Assigned</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map(emp => (
            <tr key={emp.user_id} style={{ backgroundColor: emp.tasksAssigned > 7 ? '#ffebeb' : 'inherit' }}>
              <td>{emp.user_id}</td>
              <td>{emp.name}</td>
              <td>{emp.job_title}</td>
              <td>{emp.skills}</td>
              <td>{emp.tasksAssigned} {emp.tasksAssigned > 7 && <FaExclamationTriangle style={{ color: 'red' }} />}</td>
              <td>{emp.tasksCompleted}</td>
              <td>{emp.projectsAssigned}</td>
              <td>
                <Button
                  variant={emp.tasksAssigned > 7 ? "danger" : "info"}
                  size="sm"
                  onClick={() => handleShowModal(emp)}
                >
                  {emp.tasksAssigned > 7 && <FaExclamationTriangle style={{ marginRight: '5px' }} />}
                  <FiEye /> View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Charts Section */}
      <h2 className="text-center my-4">Employee Insights</h2>
      <Row className="justify-content-center">
        <Col md={5}>
          <h4 className="text-center">Skills Distribution</h4>
          <Pie data={processSkillsData()} />
        </Col>
        <Col md={5}>
          <h4 className="text-center">Task Allocation (Top 5)</h4>
          <Bar data={processTaskData()} />
        </Col>
      </Row>

      {/* Edit Employee Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Employee Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmployee && (
            <>
              <Form>
                <Form.Group>
                  <Form.Label>Job Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Skills (comma separated)</Form.Label>
                  <Form.Control
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleSaveChanges}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManEmployees;