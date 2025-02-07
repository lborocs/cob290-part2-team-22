import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Form, Card, ProgressBar, ListGroup, ButtonGroup, Badge } from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FiPieChart, FiEdit, FiTrash2, FiArchive, FiEye, FiEyeOff } from 'react-icons/fi';

ChartJS.register(ArcElement, Tooltip, Legend);

// API URL pointing to our backend PHP file
const API_URL = 'http://35.214.101.36/ManProjects.php';
// Example current manager info
const currentUser = { user_id: 3, role: "Manager", name: "John Manager" };

const initialFormData = {
  projectName: '',
  description: '',
  teamLeader: '',
  employees: [],
  priority: 'Medium',
  deadline: '',
  tasks: [{ name: '', assignee: '', id: Date.now() }]
};

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
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}?action=getUsers`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  // Fetch projects from backend
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}?action=getProjects`);
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  // Derive project status from completed and binned fields
  const getProjectStatus = (project) => {
    if (parseInt(project.binned) === 1) return 'binned';
    if (parseInt(project.completed) === 1) return 'completed';
    return 'active';
  };

  // Group projects by status
  const groupProjectsByStatus = () => {
    return projects.reduce((acc, project) => {
      const status = getProjectStatus(project);
      acc[status] = acc[status] || [];
      acc[status].push(project);
      return acc;
    }, {});
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return 'success';
      case 'binned': return 'danger';
      default: return 'primary';
    }
  };

  // Overall Projects Progress: pie chart of completed vs active projects
  const getOverallProjectChartData = () => {
    const total = projects.length;
    const completed = projects.filter(project => parseInt(project.completed) === 1).length;
    const active = total - completed;
    return {
      labels: ['Completed Projects', 'Active Projects'],
      datasets: [{
        data: [completed, active],
        backgroundColor: ['#4CAF50', '#607D8B'],
        borderColor: ['#fff', '#fff']
      }]
    };
  };

  // Create or update a project with validations:
  // 1. Every task must have an assigned employee.
  // 2. Each task's assignee must be one of the assigned employees.
  const handleSubmit = async (e) => {
    e.preventDefault();
    for (let task of formData.tasks) {
      if (!task.assignee) {
        alert("Every task must have an assigned employee.");
        return;
      }
      if (!formData.employees.includes(task.assignee.toString())) {
        alert("Each task's assignee must be one of the assigned employees.");
        return;
      }
    }
    const payload = {
      projectName: formData.projectName,
      description: formData.description,
      priority: formData.priority,
      deadline: formData.deadline,
      teamLeader: formData.teamLeader,
      employees: formData.employees,
      tasks: formData.tasks
    };
    if (!editingProject) {
      payload.manager_id = currentUser.user_id;
    } else {
      payload.project_id = editingProject.project_id;
    }
    let url = API_URL;
    url += editingProject ? '?action=updateProject' : '?action=createProject';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await res.json();
      fetchProjects();
    } catch (err) {
      console.error('Error saving project', err);
    }
    setShowModal(false);
    setEditingProject(null);
    setFormData(initialFormData);
  };

  // Update project status fields (completed, binned)
  const updateProjectField = async (projectId, updateData) => {
    try {
      const res = await fetch(`${API_URL}?action=updateProjectField`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, ...updateData })
      });
      await res.json();
      fetchProjects();
    } catch (err) {
      console.error('Error updating project', err);
    }
  };

  const handleStatusChange = (projectId, newStatus) => {
    if (newStatus === 'binned') {
      updateProjectField(projectId, { binned: 1 });
    } else if (newStatus === 'active') {
      updateProjectField(projectId, { completed: 0, binned: 0 });
    } else if (newStatus === 'completed') {
      updateProjectField(projectId, { completed: 1, binned: 0 });
    }
  };

  // Permanently delete a project (only allowed if the project is binned)
  const handleDeleteProject = async (projectId) => {
    try {
      const res = await fetch(`${API_URL}?action=deleteProject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId })
      });
      const data = await res.json();
      if (data.success) {
        fetchProjects();
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (err) {
      console.error("Error deleting project", err);
    }
  };

  const getProjectChartData = (project) => {
    const tasks = project.tasks || [];
    const completedTasks = tasks.filter(t => parseInt(t.status) === 1).length;
    const remainingTasks = tasks.length - completedTasks;
    return {
      labels: ['Completed Tasks', 'Remaining Tasks'],
      datasets: [{
        data: [completedTasks, remainingTasks],
        backgroundColor: ['#4CAF50', '#607D8B'],
        borderColor: ['#fff', '#fff']
      }]
    };
  };

  const getUserName = (userId) => {
    const user = users.find(u => parseInt(u.user_id) === parseInt(userId));
    return user ? user.name : 'Unknown';
  };

  // Add a new task row in the project creation/edit form
  const handleAddTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { name: '', assignee: '', id: Date.now() }]
    }));
  };

  // Update a task field in the form tasks array
  const handleTaskChange = (index, field, value) => {
    const newTasks = formData.tasks.map((task, i) =>
      i === index ? { ...task, [field]: value } : task
    );
    setFormData(prev => ({ ...prev, tasks: newTasks }));
  };

  return (
    <Container>
      <h1 className="text-center my-4">Projects Management</h1>
      
      <div className="d-flex justify-content-between mb-4">
        <div>
          <Button 
            variant="primary" 
            onClick={() => {
              // When creating new project, clear form and reset editing state
              setEditingProject(null);
              setFormData(initialFormData);
              setSelectedProject(null);
              setShowProjectChart(true);
            }}
          >
            Progress Overview
          </Button>
          <Button 
            variant="primary" 
            className="ms-2" 
            onClick={() => {
              setEditingProject(null);
              setFormData(initialFormData);
              setShowModal(true);
            }}
          >
            Create New Project
          </Button>
        </div>
        <ButtonGroup>
          <Button variant={viewOptions.active ? 'primary' : 'secondary'} onClick={() => setViewOptions(prev => ({ ...prev, active: !prev.active }))}>
            {viewOptions.active ? <FiEye /> : <FiEyeOff />} Active
          </Button>
          <Button variant={viewOptions.completed ? 'success' : 'secondary'} onClick={() => setViewOptions(prev => ({ ...prev, completed: !prev.completed }))}>
            {viewOptions.completed ? <FiEye /> : <FiEyeOff />} Completed
          </Button>
          <Button variant={viewOptions.binned ? 'danger' : 'secondary'} onClick={() => setViewOptions(prev => ({ ...prev, binned: !prev.binned }))}>
            {viewOptions.binned ? <FiEye /> : <FiEyeOff />} Binned
          </Button>
        </ButtonGroup>
      </div>

      {Object.entries(groupProjectsByStatus()).map(([status, projList]) => (
        viewOptions[status] && (
          <div key={status} className="mb-5">
            <h3 className="text-capitalize mb-3">
              {status} Projects
              <Badge bg={getStatusBadge(status)} className="ms-2">
                {projList.length}
              </Badge>
            </h3>
            <Row className="g-3">
              {projList.map(project => (
                <Col md={6} lg={4} key={project.project_id}>
                  <Card className={`h-100 border-${getStatusBadge(getProjectStatus(project))}`}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <Card.Title className="fs-5 m-0">{project.name}</Card.Title>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => {
                              if(getProjectStatus(project) === 'binned') return;
                              setEditingProject(project);
                              setFormData({
                                projectName: project.name,
                                description: project.description,
                                teamLeader: project.team_leader_id,
                                employees: project.employees, // assumed as user IDs (as strings)
                                priority: project.priority,
                                deadline: project.deadline,
                                tasks: project.tasks.map(task => ({
                                  name: task.task_name,
                                  assignee: task.user_id,
                                  id: task.task_id
                                }))
                              });
                              setShowModal(true);
                            }}
                            disabled={getProjectStatus(project) === 'binned'}
                          >
                            <FiEdit />
                          </Button>
                          { getProjectStatus(project) === 'binned' ? (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-danger"
                              onClick={() => handleDeleteProject(project.project_id)}
                            >
                              <FiTrash2 />
                            </Button>
                          ) : (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-danger"
                              onClick={() => handleStatusChange(project.project_id, 'binned')}
                            >
                              <FiTrash2 />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <ProgressBar 
                          now={project.progress ? project.progress : 0} 
                          label={`${Math.round(project.progress || 0)}%`} 
                          variant={getStatusBadge(getProjectStatus(project))}
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
                        {getStatusBadge(getProjectStatus(project)) === 'danger' ? (
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => handleStatusChange(project.project_id, 'active')}
                          >
                            <FiArchive className="me-1" /> Restore
                          </Button>
                        ) : (
                          <Button 
                            variant={getStatusBadge(getProjectStatus(project)) === 'success' ? 'secondary' : 'success'} 
                            size="sm"
                            onClick={() => handleStatusChange(project.project_id, getProjectStatus(project) === 'completed' ? 'active' : 'completed')}
                          >
                            {getStatusBadge(getProjectStatus(project)) === 'success' ? 'Mark Active' : 'Mark Complete'}
                          </Button>
                        )}
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block">
                          Team Leader: {getUserName(project.team_leader_id)}
                        </small>
                        <small className="text-muted d-block">
                          Deadline: {new Date(project.deadline).toLocaleDateString()} 
                          ({(new Date(project.deadline) - new Date()) < 0 ? 'Overdue' : Math.floor((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)) + ' days left'})
                        </small>
                        <small className="text-muted d-block">
                          Assigned by: {project.managerName}
                        </small>
                      </div>

                      <Card.Text className="text-muted small mb-3">
                        {project.description}
                      </Card.Text>

                      <h6 className="small">Assigned Team</h6>
                      <div className="mb-3">
                        {project.employees && project.employees.map((emp, idx) => (
                          <Badge key={idx} bg="secondary" className="me-1">
                            {emp}
                          </Badge>
                        ))}
                      </div>

                      <h6 className="small">Tasks</h6>
                      <ListGroup variant="flush">
                        {project.tasks && project.tasks.map(task => (
                          <ListGroup.Item key={task.task_id} className="px-0">
                            <div className="d-flex justify-content-between align-items-center">
                              <Form.Check 
                                type="checkbox"
                                checked={parseInt(task.status) === 1}
                                onChange={() => {
                                  const newStatus = parseInt(task.status) === 1 ? 0 : 1;
                                  fetch(`${API_URL}?action=updateProjectTask`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ task_id: task.task_id, status: newStatus })
                                  }).then(() => fetchProjects());
                                }}
                                label={task.task_name}
                                disabled={getProjectStatus(project) === 'binned'}
                              />
                              {task.assignee && (
                                <Badge bg="info">{getUserName(task.assigned_by)}</Badge>
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
      <Modal 
        show={showModal} 
        onHide={() => { setShowModal(false); setEditingProject(null); }} 
        size="lg" 
        backdrop="static" 
        keyboard={false}
      >
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
                {users
                  .filter(user => user.role && user.role.toLowerCase() !== "manager")
                  .map(user => (
                    <option key={user.user_id} value={user.user_id}>{user.name}</option>
                  ))
                }
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
                {users
                  .filter(user => user.role && user.role.toLowerCase() !== "manager")
                  .map(user => (
                    <option key={user.user_id} value={user.user_id}>{user.name}</option>
                  ))
                }
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
                  placeholder="Task Name"
                  value={task.name}
                  onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
                />
                <Form.Select
                  value={task.assignee}
                  onChange={(e) => handleTaskChange(index, 'assignee', e.target.value)}
                >
                  <option value="">Select Assigned Employee</option>
                  {users
                    .filter(user => user.role && user.role.toLowerCase() !== "manager" && formData.employees.includes(user.user_id.toString()))
                    .map(user => (
                      <option key={user.user_id} value={user.user_id}>{user.name}</option>
                    ))
                  }
                </Form.Select>
              </div>
            ))}
            <Button variant="outline-secondary" onClick={handleAddTask}>
              Add Task
            </Button>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditingProject(null); }}>
              Close
            </Button>
            <Button variant="primary" type="submit">
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Project Progress Modal */}
      <Modal show={showProjectChart} onHide={() => { setShowProjectChart(false); setSelectedProject(null); }}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedProject ? `${selectedProject.name} Progress` : "Overall Projects Progress"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: '300px' }}>
            <Pie 
              data={ selectedProject ? getProjectChartData(selectedProject) : getOverallProjectChartData() } 
              options={{ responsive: true, maintainAspectRatio: false }} 
            />
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ManProjects;
