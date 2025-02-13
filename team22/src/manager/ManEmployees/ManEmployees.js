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
      emp[filterType]?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchQuery, filterType, employees]);

  // 🔥 Process Skills Data for Pie Chart
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
      datasets: [
        {
          data: Object.values(skillCounts),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#FF5722', '#9C27B0'],
        }
      ]
    };
  };

  // 📊 Process Task Allocation for Bar Chart
  const processTaskData = () => {
    return {
      labels: employees.map(emp => emp.name),
      datasets: [
        {
          label: "Tasks Assigned",
          data: employees.map(emp => emp.tasksAssigned),
          backgroundColor: employees.map(emp => emp.tasksAssigned > 5 ? '#FF5733' : '#36A2EB'), 
        }
      ]
    };
  };

  // 📌 Identify Skill Gaps for Training Needs
  const requiredSkills = ["Python", "SQL", "Project Management", "Data Analysis"];
  const identifySkillGaps = () => {
    const employeeSkills = new Set();
    employees.forEach(emp => {
      if (emp.skills) {
        emp.skills.split(', ').forEach(skill => employeeSkills.add(skill));
      }
    });

    return requiredSkills.filter(skill => !employeeSkills.has(skill));
  };

  return (
    <Container>
      <h1 className="text-center my-4">Manager's Employee Overview</h1>

      {/* Search and Filter */}
      <InputGroup className="mb-3">
        <Form.Control 
          type="text" 
          placeholder={`Search by ${filterType}`} 
          value={searchQuery} 
          onChange={handleSearchChange} 
        />
        <DropdownButton as={InputGroup.Append} variant="outline-secondary" title={`Filter by ${filterType}`}>
          <Dropdown.Item onClick={() => setFilterType('name')}>Name</Dropdown.Item>
          <Dropdown.Item onClick={() => setFilterType('job_title')}>Job Title</Dropdown.Item>
          <Dropdown.Item onClick={() => setFilterType('skills')}>Skills</Dropdown.Item>
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
            <tr key={emp.user_id} style={{ backgroundColor: emp.tasksAssigned > 5 ? '#ffebeb' : 'inherit' }}>
              <td>{emp.user_id}</td>
              <td>{emp.name}</td>
              <td>{emp.job_title}</td>
              <td>{emp.skills}</td>
              <td>{emp.tasksAssigned}</td>
              <td>{emp.tasksCompleted}</td>
              <td>{emp.projectsAssigned}</td>
              <td style={{ textAlign: 'center' }}>
                <Button variant={emp.tasksAssigned > 5 ? "danger" : "info"} size="sm" 
                  onClick={() => { setSelectedEmployee(emp); setShowModal(true); }}>
                  {emp.tasksAssigned > 5 && <FaExclamationTriangle style={{ marginRight: '5px' }} />}
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
          {selectedEmployee ? (
            <div>
              <p><strong>Name:</strong> {selectedEmployee.name}</p>
              <p><strong>Job Title:</strong> {selectedEmployee.job_title}</p>
              <p><strong>Skills:</strong> {selectedEmployee.skills}</p>
              <p><strong>Tasks Assigned:</strong> {selectedEmployee.tasksAssigned}</p>
              <p><strong>Tasks Completed:</strong> {selectedEmployee.tasksCompleted}</p>
              <p><strong>Projects Assigned:</strong> {selectedEmployee.projectsAssigned}</p>

              {/* Warning Message for Overloaded Employees */}
              {selectedEmployee.tasksAssigned > 5 && (
                <p style={{ color: 'red', fontWeight: 'bold' }}>
                  ⚠️ Advised: Do not assign more tasks to this employee.
                </p>
              )}
            </div>
          ) : (
            <p>Loading employee details...</p>
          )}
        </Modal.Body>
      </Modal>

      {/* Charts Side-by-Side */}
      <h2 className="text-center my-4">Employee Insights</h2>
      <Row className="justify-content-center">
        <Col md={5}>
          <h4 className="text-center">Skills Distribution</h4>
          <Pie data={processSkillsData()} />
        </Col>
        <Col md={5}>
          <h4 className="text-center">Task Allocation</h4>
          <Bar data={processTaskData()} />
        </Col>
      </Row>
    </Container>
  );
};

export default ManEmployees;
