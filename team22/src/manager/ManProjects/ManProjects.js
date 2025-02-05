import React, { useState } from 'react';
import { Container, Row, Col, Button, Modal, Form, Card, ProgressBar, ListGroup, ButtonGroup, Badge } from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FiPieChart, FiEdit, FiTrash2, FiArchive, FiEye, FiEyeOff } from 'react-icons/fi';

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
  const [showProjectChart, setShowProjectChart] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [viewOptions, setViewOptions] = useState({
    active: true,
    completed: true,
    binned: false
  });
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
    if (editingProject) {
      setProjects(projects.map(project => 
        project.id === editingProject.id ? { 
          ...formData, 
          id: editingProject.id,
          status: editingProject.status,
          progress: editingProject.progress,
          tasks: formData.tasks.map(task => ({
            ...task,
            completed: task.completed || false
          }))
        } : project
      ));
    } else {
      const newProject = {
        id: Date.now(),
        ...formData,
        status: 'active',
        progress: 0,
        createdAt: new Date().toISOString(),
        tasks: formData.tasks.map(task => ({ 
          ...task, 
          completed: false,
          id: task.id || Date.now()
        }))
      };
      setProjects([...projects, newProject]);
    }
    setShowModal(false);
    setEditingProject(null);
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

  const handleStatusChange = (projectId, newStatus) => {
    setProjects(projects.map(project => 
      project.id === projectId ? { ...project, status: newStatus } : project
    ));
  };

  const toggleView = (option) => {
    setViewOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const calculateTimeLeft = (deadline) => {
    const diff = new Date(deadline) - new Date();
    if (diff < 0) return 'Overdue';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} days left`;
  };

  const groupProjectsByStatus = () => {
    return projects.reduce((acc, project) => {
      acc[project.status] = acc[project.status] || [];
      acc[project.status].push(project);
      return acc;
    }, {});
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return 'success';
      case 'binned': return 'danger';
      default: return 'primary';
    }
  };

  return (
    <Container>
      <h1 className="text-center my-4">Projects Management</h1>
      
      <div className="d-flex justify-content-between mb-4">
        <div>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Create New Project
          </Button>
          <Button 
            variant="outline-secondary" 
            className="ms-2"
            onClick={() => setShowProjectChart(true)}
          >
            <FiPieChart className="me-2" />
            Progress Overview
          </Button>
        </div>
        
        <ButtonGroup>
          <Button 
            variant={viewOptions.active ? 'primary' : 'secondary'} 
            onClick={() => toggleView('active')}
          >
            {viewOptions.active ? <FiEye /> : <FiEyeOff />} Active
          </Button>
          <Button 
            variant={viewOptions.completed ? 'success' : 'secondary'} 
            onClick={() => toggleView('completed')}
          >
            {viewOptions.completed ? <FiEye /> : <FiEyeOff />} Completed
          </Button>
          <Button 
            variant={viewOptions.binned ? 'danger' : 'secondary'} 
            onClick={() => toggleView('binned')}
          >
            {viewOptions.binned ? <FiEye /> : <FiEyeOff />} Binned
          </Button>
        </ButtonGroup>
      </div>

      {Object.entries(groupProjectsByStatus()).map(([status, projects]) => (
        viewOptions[status] && (
          <div key={status} className="mb-5">
            <h3 className="text-capitalize mb-3">
              {status} Projects
              <Badge bg={getStatusBadge(status)} className="ms-2">
                {projects.length}
              </Badge>
            </h3>
            <Row className="g-3">
              {projects.map(project => (
                <Col md={6} lg={4} key={project.id}>
                  <Card className={`h-100 border-${getStatusBadge(project.status)}`}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <Card.Title className="fs-5 m-0">{project.projectName}</Card.Title>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => {
                              setEditingProject(project);
                              setFormData({
                                ...project,
                                tasks: project.tasks
                              });
                              setShowModal(true);
                            }}
                          >
                            <FiEdit />
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-danger"
                            onClick={() => handleStatusChange(project.id, 'binned')}
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <ProgressBar 
                          now={project.progress} 
                          label={`${Math.round(project.progress)}%`} 
                          variant={getStatusBadge(project.status)}
                          style={{ width: '70%' }}
                        />
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowProjectChart(true);
                          }}
                        >
                          <FiPieChart />
                        </Button>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <Badge bg={project.priority === 'High' ? 'danger' : project.priority === 'Medium' ? 'warning' : 'success'}>
                          {project.priority} Priority
                        </Badge>
                        {project.status === 'binned' ? (
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => handleStatusChange(project.id, 'active')}
                          >
                            <FiArchive className="me-1" /> Restore
                          </Button>
                        ) : (
                          <Button 
                            variant={project.status === 'completed' ? 'secondary' : 'success'} 
                            size="sm"
                            onClick={() => handleStatusChange(project.id, project.status === 'completed' ? 'active' : 'completed')}
                          >
                            {project.status === 'completed' ? 'Mark Active' : 'Mark Complete'}
                          </Button>
                        )}
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block">
                          Team Leader: {project.teamLeader}
                        </small>
                        <small className="text-muted d-block">
                          Deadline: {new Date(project.deadline).toLocaleDateString()} ({calculateTimeLeft(project.deadline)})
                        </small>
                      </div>

                      <Card.Text className="text-muted small mb-3">
                        {project.description}
                      </Card.Text>

                      <h6 className="small">Assigned Team</h6>
                      <div className="mb-3">
                        {project.employees.map(employee => (
                          <Badge key={employee} bg="secondary" className="me-1">
                            {employee}
                          </Badge>
                        ))}
                      </div>

                      <h6 className="small">Tasks</h6>
                      <ListGroup variant="flush">
                        {project.tasks.map(task => (
                          <ListGroup.Item key={task.id} className="px-0">
                            <div className="d-flex justify-content-between align-items-center">
                              <Form.Check 
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => handleTaskToggle(project.id, task.id)}
                                label={task.name}
                                disabled={project.status === 'binned'}
                              />
                              {task.assignee && (
                                <Badge bg="info">{task.assignee}</Badge>
                              )}
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )
      ))}

      {/* Project Creation/Edit Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setEditingProject(null);
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingProject ? 'Edit Project' : 'Create New Project'}</Modal.Title>
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
            <Button variant="secondary" onClick={() => {
              setShowModal(false);
              setEditingProject(null);
            }}>
              Close
            </Button>
            <Button variant="primary" type="submit">
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Project Progress Modal */}
      <Modal show={showProjectChart} onHide={() => setShowProjectChart(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedProject?.projectName} Progress</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProject && (
            <div style={{ height: '300px' }}>
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
    </Container>
  );
};

export default ManProjects;