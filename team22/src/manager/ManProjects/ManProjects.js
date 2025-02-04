import React, { useState } from 'react';
import { Container, Row, Col, Button, Modal, Form, Card, ProgressBar, ListGroup } from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FiPieChart } from 'react-icons/fi';

ChartJS.register(ArcElement, Tooltip, Legend);

const employees = [
  'Micheal Jones',
  'Alice Smith',
  'Emma Khan',
  'Tom Clark',
  'Raj Patel'
];

const ManProjects = () => {
  const [showModal, setShowModal] = useState(false);
  const [showOverallChart, setShowOverallChart] = useState(false);
  const [showProjectChart, setShowProjectChart] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    projectName: '',
    teamLeader: '',
    employees: [],
    priority: 'Medium',
    deadline: '',
    description: '',
    tasks: [{ name: '', assignee: '', id: Date.now() }]
  });

  const handleAddTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { name: '', assignee: '', id: Date.now() }]
    }));
  };

  const handleTaskChange = (index, field, value) => {
    const newTasks = formData.tasks.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    );
    setFormData(prev => ({ ...prev, tasks: newTasks }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProject = {
      id: Date.now(),
      ...formData,
      completed: false,
      progress: 0,
      createdAt: new Date().toISOString(),
      tasks: formData.tasks.map(task => ({ 
        ...task, 
        completed: false,
        id: task.id || Date.now()
      }))
    };
    setProjects([...projects, newProject]);
    setShowModal(false);
    setFormData({
      projectName: '',
      teamLeader: '',
      employees: [],
      priority: 'Medium',
      deadline: '',
      description: '',
      tasks: [{ name: '', assignee: '', id: Date.now() }]
    });
  };

  const handleTaskToggle = (projectId, taskId) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        const updatedTasks = project.tasks.map(task => 
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const progress = (completedCount / updatedTasks.length) * 100;
        return { ...project, tasks: updatedTasks, progress };
      }
      return project;
    }));
  };

  const handleToggleComplete = (projectId) => {
    setProjects(projects.map(project => 
      project.id === projectId ? { ...project, completed: !project.completed } : project
    ));
  };

  const calculateTimeLeft = (deadline) => {
    const diff = new Date(deadline) - new Date();
    if (diff < 0) return 'Overdue';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} days left`;
  };

  const getOverallChartData = () => {
    const completedProjects = projects.filter(p => p.completed).length;
    const activeProjects = projects.filter(p => !p.completed).length;

    return {
      labels: ['Completed Projects', 'Active Projects'],
      datasets: [{
        label: 'Projects',
        data: [completedProjects, activeProjects],
        backgroundColor: ['#4CAF50', '#607D8B'],
        borderColor: ['#fff', '#fff']
      }]
    };
  };

  const getProjectChartData = (project) => {
    const completedTasks = project.tasks.filter(t => t.completed).length;
    const remainingTasks = project.tasks.length - completedTasks;

    return {
      labels: ['Completed Tasks', 'Remaining Tasks'],
      datasets: [{
        data: [completedTasks, remainingTasks],
        backgroundColor: ['#4CAF50', '#607D8B'],
        borderColor: ['#fff', '#fff']
      }]
    };
  };

  return (
    <Container>
      <h1 className="text-center my-4">Manager's Projects Dashboard</h1>
      
      <Row className="mb-4 align-items-center">
        <Col md={6}>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Create New Project
          </Button>
          <Button 
            variant="outline-secondary" 
            className="ms-2"
            onClick={() => setShowOverallChart(true)}
          >
            <FiPieChart className="me-2" />
            View Overall Progress
          </Button>
        </Col>
      </Row>

      {/* Active Projects Section */}
      <h3 className="mt-4">Active Projects</h3>
      <Row className="mt-2">
        {projects.filter(p => !p.completed).map(project => (
          <ProjectCard 
            key={project.id}
            project={project}
            onToggleComplete={handleToggleComplete}
            onTaskToggle={handleTaskToggle}
            calculateTimeLeft={calculateTimeLeft}
            onViewChart={() => {
              setSelectedProject(project);
              setShowProjectChart(true);
            }}
          />
        ))}
      </Row>

      {/* Completed Projects Section */}
      {projects.filter(p => p.completed).length > 0 && (
        <>
          <h3 className="mt-5">Completed Projects</h3>
          <Row className="mt-2">
            {projects.filter(p => p.completed).map(project => (
              <ProjectCard 
                key={project.id}
                project={project}
                onToggleComplete={handleToggleComplete}
                onTaskToggle={handleTaskToggle}
                calculateTimeLeft={calculateTimeLeft}
                onViewChart={() => {
                  setSelectedProject(project);
                  setShowProjectChart(true);
                }}
              />
            ))}
          </Row>
        </>
      )}

      {/* Overall Progress Modal */}
      <Modal show={showOverallChart} onHide={() => setShowOverallChart(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Overall Progress</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="chart-container" style={{ height: '300px' }}>
            <Pie 
              data={getOverallChartData()} 
              options={{ 
                responsive: true,
                maintainAspectRatio: false
              }} 
            />
          </div>
        </Modal.Body>
      </Modal>

      {/* Project Progress Modal */}
      <Modal show={showProjectChart} onHide={() => setShowProjectChart(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedProject?.projectName} Progress</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProject && (
            <div className="chart-container" style={{ height: '300px' }}>
              <Pie 
                data={getProjectChartData(selectedProject)} 
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false
                }} 
              />
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Project Creation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Project</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Project Name</Form.Label>
              <Form.Control 
                required
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Team Leader</Form.Label>
              <Form.Select
                required
                value={formData.teamLeader}
                onChange={(e) => setFormData({ ...formData, teamLeader: e.target.value })}
              >
                <option value="">Select Team Leader</option>
                {employees.map((employee, index) => (
                  <option key={index} value={employee}>{employee}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Assign Employees</Form.Label>
              <Form.Select
                multiple
                value={formData.employees}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  employees: Array.from(e.target.selectedOptions, option => option.value)
                })}
              >
                {employees.map((employee, index) => (
                  <option key={index} value={employee}>{employee}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Hold CTRL/CMD to select multiple employees
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Priority Level</Form.Label>
              <Form.Select 
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Deadline</Form.Label>
              <Form.Control 
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <h5>Tasks</h5>
            {formData.tasks.map((task, index) => (
              <div key={task.id} className="d-flex gap-2 mb-2">
                <Form.Control
                  placeholder="Task name"
                  value={task.name}
                  onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
                />
                <Form.Select
                  value={task.assignee}
                  onChange={(e) => handleTaskChange(index, 'assignee', e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {formData.employees.map((employee, idx) => (
                    <option key={idx} value={employee}>{employee}</option>
                  ))}
                </Form.Select>
              </div>
            ))}
            <Button variant="outline-secondary" onClick={handleAddTask}>
              Add Task
            </Button>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="primary" type="submit">
              Create Project
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

const ProjectCard = ({ project, onToggleComplete, onTaskToggle, calculateTimeLeft, onViewChart }) => {
  const completedTasks = project.tasks.filter(t => t.completed);
  const activeTasks = project.tasks.filter(t => !t.completed);

  return (
    <Col md={6} lg={4} className="mb-4">
      <Card className={`h-100 ${project.completed ? 'border-success' : ''}`}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <Card.Title className="fs-5 m-0">{project.projectName}</Card.Title>
            <Button 
              variant={project.completed ? 'success' : 'outline-secondary'}
              size="sm"
              onClick={() => onToggleComplete(project.id)}
            >
              {project.completed ? 'Completed ✓' : 'Mark Complete'}
            </Button>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <ProgressBar 
              now={project.progress} 
              label={`${Math.round(project.progress)}%`} 
              variant={project.completed ? 'success' : 'primary'}
              style={{ width: '70%' }}
            />
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={onViewChart}
            >
              <FiPieChart />
            </Button>
          </div>

          <Card.Subtitle className="text-muted small">
            <div className="d-flex justify-content-between">
              <span>Team Leader: {project.teamLeader}</span>
              <span className={`badge ${project.priority === 'High' ? 'bg-danger' : 
                                project.priority === 'Medium' ? 'bg-warning' : 'bg-success'}`}>
                {project.priority}
              </span>
            </div>
            <div className="mt-1">
              <small>Team: {project.employees.join(', ')}</small>
            </div>
          </Card.Subtitle>

          <div className="my-3">
            <small className="d-block text-muted">
              Deadline: {new Date(project.deadline).toLocaleDateString()} ({calculateTimeLeft(project.deadline)})
            </small>
          </div>

          <Card.Text className="text-muted small mb-3">
            {project.description}
          </Card.Text>

          <h6 className="small">Active Tasks ({activeTasks.length})</h6>
          <ListGroup variant="flush" className="mb-3">
            {activeTasks.map(task => (
              <ListGroup.Item key={task.id} className="px-0">
                <Form.Check 
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onTaskToggle(project.id, task.id)}
                  label={task.name}
                  disabled={project.completed}
                />
                {task.assignee && 
                  <small className="text-muted ms-3">Assigned to: {task.assignee}</small>}
              </ListGroup.Item>
            ))}
          </ListGroup>

          {completedTasks.length > 0 && (
            <>
              <h6 className="small">Completed Tasks ({completedTasks.length})</h6>
              <ListGroup variant="flush">
                {completedTasks.map(task => (
                  <ListGroup.Item key={task.id} className="px-0 bg-light">
                    <Form.Check 
                      type="checkbox"
                      checked={true}
                      onChange={() => onTaskToggle(project.id, task.id)}
                      label={task.name}
                      disabled={project.completed}
                    />
                    {task.assignee && 
                      <small className="text-muted ms-3">Assigned to: {task.assignee}</small>}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
};

export default ManProjects;