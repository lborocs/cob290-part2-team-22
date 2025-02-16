import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Table, 
  Button, 
  Form, 
  Modal, 
  InputGroup, 
  Dropdown, 
  DropdownButton, 
  Row, 
  Col, 
  OverlayTrigger, 
  Tooltip 
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FiEye } from 'react-icons/fi';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement);

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

    // Sorting logic
    if (sortType === 'individualTasks') {
      // Sort by individualTasks descending
      filtered.sort((a, b) => b.individualTasks - a.individualTasks);
    } else if (sortType === 'projectTasksAssigned') {
      // Sort by projectTasksAssigned descending
      filtered.sort((a, b) => b.projectTasksAssigned - a.projectTasksAssigned);
    } else if (sortType === 'projectsAssigned') {
      // Sort by projectsAssigned descending
      filtered.sort((a, b) => b.projectsAssigned - a.projectsAssigned);
    }

    setFilteredEmployees(filtered);
  }, [searchQuery, filterType, employees, sortType]);

  // Function to return warnings for an employee based on multiple conditions.
  const getWarnings = (emp) => {
    const warnings = [];
    if (emp.individualTasks > 15) {
      warnings.push({ 
        message: "Severe Warning: Employee has more than 15 individual tasks assigned. This indicates an excessive workload that may lead to burnout, significant delays, and quality issues.", 
        type: "tasksOver15" 
      });
    } else if (emp.individualTasks > 7) {
      warnings.push({ 
        message: "Warning: Employee has more than 7 individual tasks assigned. This workload could start affecting efficiency and may require closer monitoring to prevent overload.", 
        type: "tasksOver7" 
      });
    }
    if (emp.tasksDueSoon >= 5) {
      warnings.push({ 
        message: "Urgent Warning: Employee has 5 or more tasks due within the next 2 days. This suggests critical upcoming deadlines that, if not managed properly, could result in missed targets.", 
        type: "tasksDueSoon" 
      });
    }
    if (emp.projectsAssigned > 3) {
      warnings.push({ 
        message: "Notice: Employee is involved in more than 3 projects. This divided focus may reduce overall effectiveness and increase the risk of errors.", 
        type: "projectsOver3" 
      });
    }
    return warnings;
  };

  // Function to choose icon color based on warning type
  const getWarningIconColor = (type) => {
    switch(type) {
      case "tasksOver15":
        return '#FF5733'; // Red for severe overload
      case "tasksOver7":
        return '#FFCE56'; // Yellow for moderate overload
      case "tasksDueSoon":
        return '#FFA500'; // Orange for urgent deadlines
      case "projectsOver3":
        return '#36A2EB'; // Blue for divided focus
      default:
        return 'red';
    }
  };

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
      const resData = await response.json();
      console.log('Update response:', resData);
      if (response.ok && resData.success) {
        // Refresh the employee list after updating
        fetchEmployees();
        setShowModal(false);
      } else {
        console.error('Failed to update employee', resData);
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

  // Process data for the task allocation bar chart (Top 5)
  const processTaskData = () => {
    const topEmployees = [...employees]
      .sort((a, b) => b.individualTasks - a.individualTasks)
      .slice(0, 5);

    return {
      labels: topEmployees.map(emp => emp.name),
      datasets: [{
        label: "Individual Tasks",
        data: topEmployees.map(emp => emp.individualTasks),
        backgroundColor: topEmployees.map(emp => {
          if (emp.individualTasks > 15) return '#FF5733'; // Red
          else if (emp.individualTasks > 7) return '#FFA500'; // Orange
          else return '#36A2EB'; // Blue
        }),
      }]
    };
  };

  // Process data for a warnings overview chart
  const processWarningChartData = () => {
    let tasksOver7Count = 0;
    let tasksOver15Count = 0;
    let tasksDueSoonCount = 0;
    let projectsOver3Count = 0;
    employees.forEach(emp => {
      if (emp.individualTasks > 15) {
        tasksOver15Count++;
      } else if (emp.individualTasks > 7) {
        tasksOver7Count++;
      }
      if (emp.tasksDueSoon >= 5) {
        tasksDueSoonCount++;
      }
      if (emp.projectsAssigned > 3) {
        projectsOver3Count++;
      }
    });
    return {
      labels: ['>7 Tasks', '>15 Tasks', '5+ Tasks Due Soon', '>3 Projects'],
      datasets: [{
        label: 'Warning Counts',
        data: [tasksOver7Count, tasksOver15Count, tasksDueSoonCount, projectsOver3Count],
        backgroundColor: ['#FFCE56', '#FF5733', '#FFA500', '#36A2EB'],
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
          <Dropdown.Item onClick={() => setSortType('individualTasks')}>Most Individual Tasks</Dropdown.Item>
          <Dropdown.Item onClick={() => setSortType('projectTasksAssigned')}>Most Project Tasks</Dropdown.Item>
          <Dropdown.Item onClick={() => setSortType('projectsAssigned')}>Most Projects Assigned</Dropdown.Item>
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
            <th>Individual Tasks</th>
            <th>Project Tasks Assigned</th>
            <th>Tasks Completed</th>
            <th>Projects Assigned</th>
            <th>Warnings</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map(emp => {
            const warnings = getWarnings(emp);
            return (
              <tr 
                key={emp.user_id} 
                style={{ backgroundColor: warnings.length > 0 ? '#ffebeb' : 'inherit' }}
              >
                <td>{emp.user_id}</td>
                <td>{emp.name}</td>
                <td>{emp.job_title}</td>
                <td>{emp.skills}</td>
                <td>{emp.individualTasks}</td>
                <td>{emp.projectTasksAssigned}</td>
                <td>{emp.tasksCompleted}</td>
                <td>{emp.projectsAssigned}</td>
                <td>
                  {warnings.map((warning, index) => (
                    <OverlayTrigger 
                      key={index} 
                      placement="top" 
                      overlay={<Tooltip>{warning.message}</Tooltip>}
                    >
                      <span style={{ marginRight: '5px' }}>
                        <FaExclamationTriangle style={{ color: getWarningIconColor(warning.type), cursor: 'pointer' }} />
                      </span>
                    </OverlayTrigger>
                  ))}
                </td>
                <td>
                  <Button
                    variant={warnings.length > 0 ? "danger" : "info"}
                    size="sm"
                    onClick={() => handleShowModal(emp)}
                  >
                    <FiEye /> View
                  </Button>
                </td>
              </tr>
            );
          })}
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
          <h4 className="text-center">Individual Task Allocation (Top 5)</h4>
          <Bar data={processTaskData()} />
        </Col>
      </Row>
      
      {/* Warnings Overview Chart */}
      <Row className="justify-content-center my-4">
        <Col md={12}>
          <h4 className="text-center">Warnings Overview</h4>
          <Bar data={processWarningChartData()} />
        </Col>
      </Row>

      {/* Edit Employee Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Employee Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmployee && (
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
