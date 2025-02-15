"use client"

import React, { useState, useEffect } from 'react'
import {
  Container,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Card,
  ProgressBar,
  ListGroup,
  ButtonGroup,
  Badge,
} from 'react-bootstrap'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { 
  FiPieChart, FiEdit, FiTrash2, FiArchive, FiEye, FiEyeOff, FiPlus, FiCheckCircle, FiXCircle 
} from 'react-icons/fi'

ChartJS.register(ArcElement, Tooltip, Legend)

const API_URL = 'http://35.214.101.36/ManProjects.php'
const currentUser = { user_id: 3, role: "Manager", name: "John Manager" }

const initialFormData = {
  projectName: '',
  description: '',
  teamLeader: '',
  employees: [],
  priority: 'Medium',
  deadline: '',
  tasks: [{ name: '', assignee: '', id: Date.now() }]
}

const ManProjects = () => {
  const [showModal, setShowModal] = useState(false)
  const [showProjectChart, setShowProjectChart] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [viewOptions, setViewOptions] = useState({
    active: true,
    completed: true,
    binned: false
  })
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState(initialFormData)
  // New filtering states:
  const [selectedTeamLeader, setSelectedTeamLeader] = useState(null); 
  const [deadlineDays, setDeadlineDays] = useState("")
  const [selectedPriority, setSelectedPriority] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}?action=getUsers`)
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error('Error fetching users', err)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}?action=getProjects`)
      const data = await res.json()
      setProjects(data)
    } catch (err) {
      console.error('Error fetching projects', err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchProjects()
  }, [])

  // When projects update, update the selectedTeamLeaders filter
  // Remove any team leader ID that no longer appears in any project.
  
  const getProjectStatus = (project) => {
    if (parseInt(project.binned) === 1) return 'binned'
    if (parseInt(project.completed) === 1) return 'completed'
    return 'active'
  }

  // Group projects by status after applying team leader and deadline filters.
  const groupProjectsByStatus = () => {
    let filteredProjects = projects;
  
    // Filter by team leader
    if (selectedTeamLeader) {
      filteredProjects = filteredProjects.filter(
        (project) => project.team_leader_id.toString() === selectedTeamLeader
      );
    }
  
    // Filter by priority
    if (selectedPriority) {
      filteredProjects = filteredProjects.filter(
        (project) => project.priority === selectedPriority
      );
    }
  
    // Filter by deadline range
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
  
      filteredProjects = filteredProjects.filter((project) => {
        const projectDeadline = new Date(project.deadline);
        return (
          (!start || projectDeadline >= start) &&
          (!end || projectDeadline <= end)
        );
      });
    }
  
    return filteredProjects.reduce((acc, project) => {
      const status = getProjectStatus(project);
      acc[status] = acc[status] || [];
      acc[status].push(project);
      return acc;
    }, {});
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return 'success'
      case 'binned': return 'danger'
      default: return 'primary'
    }
  }

  const getOverallProjectChartData = () => {
    const total = projects.length
    const completed = projects.filter(project => parseInt(project.completed) === 1).length
    const active = total - completed
    return {
      labels: ['Completed Projects', 'Active Projects'],
      datasets: [{
        data: [completed, active],
        backgroundColor: ['#4CAF50', '#607D8B'],
        borderColor: ['#fff', '#fff']
      }]
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    for (let task of formData.tasks) {
      if (!task.assignee) {
        alert("Every task must have an assigned employee.")
        return
      }
      if (!formData.employees.includes(task.assignee.toString())) {
        alert("Each task's assignee must be one of the assigned employees.")
        return
      }
    }
    const payload = {
      projectName: formData.projectName,
      description: formData.description,
      priority: formData.priority,
      deadline: formData.deadline,
      teamLeader: formData.teamLeader,
      employees: formData.employees,
      tasks: formData.tasks,
    }
    if (!editingProject) {
      payload.manager_id = currentUser.user_id
    } else {
      payload.project_id = editingProject.project_id
    }
    let url = API_URL
    url += editingProject ? '?action=updateProject' : '?action=createProject'
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      await res.json()
      // Refresh both projects and users so that the filtering dropdown updates immediately.
      fetchProjects()
      fetchUsers()
    } catch (err) {
      console.error('Error saving project', err)
    }
    setShowModal(false)
    setEditingProject(null)
    setFormData(initialFormData)
  }

  const updateProjectField = async (projectId, updateData) => {
    try {
      const res = await fetch(`${API_URL}?action=updateProjectField`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, ...updateData }),
      })
      await res.json()
      fetchProjects()
    } catch (err) {
      console.error('Error updating project', err)
    }
  }

  const handleStatusChange = (projectId, newStatus) => {
    if (newStatus === 'binned') {
      updateProjectField(projectId, { binned: 1 })
    } else if (newStatus === 'active') {
      updateProjectField(projectId, { completed: 0, binned: 0 })
    } else if (newStatus === 'completed') {
      updateProjectField(projectId, { completed: 1, binned: 0 })
    }
  }

  const handleDeleteProject = async (projectId) => {
    try {
      const res = await fetch(`${API_URL}?action=deleteProject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })
      const data = await res.json()
      if (data.success) {
        fetchProjects()
      } else {
        alert("Delete failed: " + data.error)
      }
    } catch (err) {
      console.error("Error deleting project", err)
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`${API_URL}?action=deleteTask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      })
      const data = await res.json()
      if (data.success) {
        fetchProjects()
      } else {
        alert("Delete failed: " + data.error)
      }
    } catch (err) {
      console.error("Error deleting task", err)
    }
  }

  const getProjectChartData = (project) => {
    const tasks = project.tasks || []
    const completedTasks = tasks.filter(t => parseInt(t.status) === 1).length
    const remainingTasks = tasks.length - completedTasks
    return {
      labels: ['Completed Tasks', 'Remaining Tasks'],
      datasets: [{
        data: [completedTasks, remainingTasks],
        backgroundColor: ['#4CAF50', '#607D8B'],
        borderColor: ['#fff', '#fff']
      }]
    }
  }

  const getUserName = (userId) => {
    const user = users.find(u => u.user_id == userId)
    return user ? user.name : 'Unknown'
  }

  const handleAddTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { name: '', assignee: '', id: Date.now() }]
    }))
  }

  const handleTaskChange = (index, field, value) => {
    const newTasks = formData.tasks.map((task, i) =>
      i === index ? { ...task, [field]: value } : task
    )
    setFormData(prev => ({ ...prev, tasks: newTasks }))
  }

  const handleFormTaskDelete = (taskId) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }))
  }

  // Handler for team leader filter (multiple selection) in the filtering dropdown.
  // This dropdown now shows only users with role "team leader" who have at least one project.
 
 

  // Compute the available team leaders for filtering based on current projects.
  const availableTeamLeaders = users.filter(
    user =>
      user.role &&
      user.role.toLowerCase() === "team leader" &&
      projects.some(project => project.team_leader_id == user.user_id)
  );

  return (
    <Container fluid className="py-4 bg-light">
      <h1 className="text-center mb-4">Projects Management Dashboard</h1>

      {/* New Filtering Options */}
      <Form className="mb-4">
        <Row>
          <Col md={4}>
            <Form.Group controlId="teamLeaderFilter" className="mb-3">
              <Form.Label>Filter by Team Leader</Form.Label>
              <div className="d-flex gap-2">
                <Form.Select
                  value={selectedTeamLeader || ""}
                  onChange={(e) => setSelectedTeamLeader(e.target.value || null)}
                >
                  <option value="">All Team Leaders</option>
                  {availableTeamLeaders.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.name}
                    </option>
                  ))}
                </Form.Select>
                <Button
                  variant="outline-secondary"
                  onClick={() => setSelectedTeamLeader(null)}
                  disabled={!selectedTeamLeader}
                >
                  Clear
                </Button>
              </div>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="priorityFilter" className="mb-3">
              <Form.Label>Filter by Priority</Form.Label>
              <div className="d-flex gap-2">
                <Form.Select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                >
                  <option value="">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Form.Select>
                <Button
                  variant="outline-secondary"
                  onClick={() => setSelectedPriority("")}
                  disabled={!selectedPriority}
                >
                  Clear
                </Button>
              </div>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="deadlineFilter" className="mb-3">
              <Form.Label>Filter by Deadline</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start Date"
                />
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End Date"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  disabled={!startDate && !endDate}
                >
                  Clear
                </Button>
              </div>
            </Form.Group>
          </Col>
        </Row>
      </Form>

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div className="mb-2 mb-md-0">
          <Button
            variant="outline-primary"
            className="me-2"
            onClick={() => {
              setEditingProject(null)
              setFormData(initialFormData)
              setSelectedProject(null)
              setShowProjectChart(true)
            }}
          >
            <FiPieChart className="me-2" />
            Progress Overview
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setEditingProject(null)
              setFormData(initialFormData)
              setShowModal(true)
            }}
          >
            <FiPlus className="me-2" />
            Create New Project
          </Button>
        </div>
        <ButtonGroup>
          <Button
            variant={viewOptions.active ? "primary" : "outline-primary"}
            onClick={() =>
              setViewOptions(prev => ({ ...prev, active: !prev.active }))
            }
          >
            {viewOptions.active ? <FiEye /> : <FiEyeOff />} Active
          </Button>
          <Button
            variant={viewOptions.completed ? "success" : "outline-success"}
            onClick={() =>
              setViewOptions(prev => ({ ...prev, completed: !prev.completed }))
            }
          >
            {viewOptions.completed ? <FiEye /> : <FiEyeOff />} Completed
          </Button>
          <Button
            variant={viewOptions.binned ? "danger" : "outline-danger"}
            onClick={() =>
              setViewOptions(prev => ({ ...prev, binned: !prev.binned }))
            }
          >
            {viewOptions.binned ? <FiEye /> : <FiEyeOff />} Binned
          </Button>
        </ButtonGroup>
      </div>

      {Object.entries(groupProjectsByStatus()).map(
        ([status, projList]) =>
          viewOptions[status] && (
            <div key={status} className="mb-5">
              <h3 className="text-capitalize mb-3">
                {status} Projects
                <Badge bg={getStatusBadge(status)} className="ms-2">
                  {projList.length}
                </Badge>
              </h3>
              <Row className="g-4">
                {projList.map(project => (
                  <Col md={6} lg={4} key={project.project_id}>
                    <Card className={`h-100 border-${getStatusBadge(getProjectStatus(project))}`}>
                      <Card.Header
                        className={`bg-${getStatusBadge(getProjectStatus(project))} text-white d-flex justify-content-between align-items-center`}
                      >
                        <h5 className="mb-0">{project.name}</h5>
                        <div>
                          <Button
                            variant="link"
                            className="text-white p-0 me-2"
                            onClick={() => {
                              if(getProjectStatus(project) === 'binned') return;
                              setEditingProject(project)
                              setFormData({
                                projectName: project.name,
                                description: project.description,
                                teamLeader: project.team_leader_id,
                                employees: project.employees,
                                priority: project.priority,
                                deadline: project.deadline,
                                tasks: project.tasks.map(task => ({
                                  name: task.task_name,
                                  assignee: task.user_id,
                                  id: task.task_id,
                                })),
                              })
                              setShowModal(true)
                            }}
                            disabled={getProjectStatus(project) === 'binned'}
                          >
                            <FiEdit />
                          </Button>
                          { getProjectStatus(project) === 'binned' ? (
                            <Button
                              variant="link"
                              className="text-white p-0"
                              onClick={() => handleDeleteProject(project.project_id)}
                            >
                              <FiTrash2 />
                            </Button>
                          ) : (
                            <Button
                              variant="link"
                              className="text-white p-0"
                              onClick={() => handleStatusChange(project.project_id, 'binned')}
                            >
                              <FiTrash2 />
                            </Button>
                          )}
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <ProgressBar
                            now={project.progress ? project.progress : 0}
                            label={`${Math.round(project.progress || 0)}%`}
                            variant={getStatusBadge(getProjectStatus(project))}
                            style={{ width: "80%", height: "10px" }}
                          />
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project)
                              setShowProjectChart(true)
                            }}
                          >
                            <FiPieChart />
                          </Button>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <Badge
                            bg={
                              project.priority === "High"
                                ? "danger"
                                : project.priority === "Medium"
                                ? "warning"
                                : "success"
                            }
                          >
                            {project.priority} Priority
                          </Badge>
                          {getStatusBadge(getProjectStatus(project)) === "danger" ? (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleStatusChange(project.project_id, "active")}
                            >
                              <FiArchive className="me-1" /> Restore
                            </Button>
                          ) : (
                            <Button
                              variant={getStatusBadge(getProjectStatus(project)) === "success" ? "outline-secondary" : "outline-success"}
                              size="sm"
                              onClick={() =>
                                handleStatusChange(
                                  project.project_id,
                                  getProjectStatus(project) === "completed" ? "active" : "completed"
                                )
                              }
                            >
                              {getStatusBadge(getProjectStatus(project)) === "success" ? (
                                <FiXCircle className="me-1" />
                              ) : (
                                <FiCheckCircle className="me-1" />
                              )}
                              {getStatusBadge(getProjectStatus(project)) === "success"
                                ? "Mark Active"
                                : "Mark Complete"}
                            </Button>
                          )}
                        </div>

                        <div className="mb-3">
                          <small className="text-muted d-block">
                            <strong>Team Leader:</strong> {getUserName(project.team_leader_id)}
                          </small>
                          <small className="text-muted d-block">
                            <strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()} (
                            {new Date(project.deadline) - new Date() < 0
                              ? "Overdue"
                              : Math.floor((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)) + " days left"}
                            )
                          </small>
                          <small className="text-muted d-block">
                            <strong>Assigned by:</strong> {project.managerName}
                          </small>
                        </div>

                        <Card.Text className="text-muted small mb-3">
                          {project.description}
                        </Card.Text>

                        <h6 className="small">Assigned Team</h6>
                        <div className="mb-3">
                          {project.employees &&
                            project.employees.map((emp, idx) => (
                              <Badge key={idx} bg="secondary" className="me-1 mb-1">
                                {getUserName(emp)}
                              </Badge>
                            ))
                          }
                        </div>

                        <h6 className="small">Tasks</h6>
                        <ListGroup variant="flush">
                          {project.tasks &&
                            project.tasks.map(task => (
                              <ListGroup.Item key={task.task_id} className="px-0">
                                <div className="d-flex justify-content-between align-items-center">
                                  <Form.Check 
                                    type="checkbox"
                                    id={`task-${task.task_id}`}
                                    checked={parseInt(task.status) === 1}
                                    onChange={async () => {
                                      const newStatus = parseInt(task.status) === 1 ? 0 : 1
                                      try {
                                        const response = await fetch(`${API_URL}?action=updateProjectTask`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ task_id: task.task_id, status: newStatus }),
                                        })
                                        if (!response.ok) {
                                          throw new Error(`HTTP error! status: ${response.status}`)
                                        }
                                        await response.json()
                                        await fetchProjects()
                                      } catch (error) {
                                        console.error("Error updating task status:", error)
                                        alert("Failed to update task status. Please try again.")
                                      }
                                    }}
                                    label={task.task_name}
                                    disabled={getProjectStatus(project) === 'binned'}
                                  />
                                  <div>
                                    {task.assignee && (
                                      <Badge bg="info" className="me-2">{getUserName(task.assigned_by)}</Badge>
                                    )}
                                  </div>
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
      )}

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
                {/* In the modal, show all employees except managers */}
                {users
                  .filter(user => user.role && user.role.toLowerCase() !== "manager")
                  .map(user => (
                    <option key={user.user_id} value={user.user_id}>{user.name}</option>
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
                {users
                  .filter(user => user.role && user.role.toLowerCase() !== "manager")
                  .map(user => (
                    <option key={user.user_id} value={user.user_id}>{user.name}</option>
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
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <h5>Tasks</h5>
            {formData.tasks.map((task, index) => (
              <div key={task.id} className="d-flex gap-2 mb-2 align-items-center">
                <Form.Control
                  placeholder="Task Name"
                  value={task.name}
                  onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
                  style={{ flex: 2 }}
                />
                <Form.Select
                  value={task.assignee}
                  onChange={(e) => handleTaskChange(index, 'assignee', e.target.value)}
                  style={{ flex: 2 }}
                >
                  <option value="">Select Assigned Employee</option>
                  {users
                    .filter(user =>
                      user.role &&
                      user.role.toLowerCase() !== "manager" &&
                      formData.employees.includes(user.user_id.toString())
                    )
                    .map(user => (
                      <option key={user.user_id} value={user.user_id}>{user.name}</option>
                    ))}
                </Form.Select>
                <Button
                  variant="danger"
                  onClick={() => handleFormTaskDelete(task.id)}
                  disabled={formData.tasks.length === 1}
                  style={{ flex: 0 }}
                >
                  <FiTrash2 />
                </Button>
              </div>
            ))}
            <Button variant="outline-secondary" onClick={handleAddTask} className="mt-2">
              <FiPlus className="me-2" />
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

      <Modal show={showProjectChart} onHide={() => { setShowProjectChart(false); setSelectedProject(null); }}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedProject ? `${selectedProject.name} Progress` : "Overall Projects Progress"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: '300px' }}>
            <Pie 
              data={ selectedProject ? getProjectChartData(selectedProject) : getOverallProjectChartData() } 
              options={{ 
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                  },
                },
              }} 
            />
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  )
}

export default ManProjects
