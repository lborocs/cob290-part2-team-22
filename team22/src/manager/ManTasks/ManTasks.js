import React, { useState, useEffect } from 'react';
import { Container, Button, Modal, Form, Card, Badge, ButtonGroup } from 'react-bootstrap';
import { Row, Col } from "antd";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FiPieChart, FiEdit, FiTrash2, FiArchive, FiEye, FiEyeOff } from 'react-icons/fi';

ChartJS.register(ArcElement, Tooltip, Legend);

// Set the API URL and the current logged-in manager (adjust as needed)
const API_URL = 'http://35.214.101.36/ManTasks.php';
// Example current manager info
const currentUser = { user_id: 3, role: "Manager", name: "John Manager" };

const ManTasks = () => {
  const [showModal, setShowModal] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [viewOptions, setViewOptions] = useState({
    active: true,
    completed: true,
    binned: false
  });
  // formData corresponds to the individual_tasks fields
  const [formData, setFormData] = useState({
    priority: 'Medium',
    deadline: '',
    assignedTo: ''
  });

  // Fetch users from the backend (include role for filtering)
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}?action=getUsers`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users', err);
    }
  };

  // Fetch tasks from the backend (all individual_tasks)
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}?action=getTasks`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, []);

  // For managers, filter tasks so that they only see tasks they assigned
  const filterTasksByManager = (allTasks) => {
    if (currentUser.role === "Manager") {
      return allTasks.filter(task => parseInt(task.assigned_by) === currentUser.user_id);
    }
    return allTasks;
  };

  // Group tasks by assigned user (user_id) with view filtering applied
  const groupTasks = () => {
    const filteredTasks = filterTasksByManager(tasks);
    return filteredTasks.reduce((acc, task) => {
      // Check view options
      if (parseInt(task.binned) === 1) {
        if (!viewOptions.binned) return acc;
      } else {
        if (parseInt(task.status) === 0 && !viewOptions.active) return acc;
        if (parseInt(task.status) === 1 && !viewOptions.completed) return acc;
      }
      acc[task.user_id] = acc[task.user_id] || [];
      acc[task.user_id].push(task);
      return acc;
    }, {});
  };

  // Lookup a user's name by their user_id
  const getUserName = (userId) => {
    const user = users.find(u => parseInt(u.user_id) === parseInt(userId));
    return user ? user.name : 'Unknown';
  };

  // Create or update a task. When creating a new task, include assigned_by as the current manager.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      user_id: formData.assignedTo,
      priority: formData.priority,
      deadline: formData.deadline
    };
    // When creating a new task, add assigned_by field.
    if (!editingTask) {
      payload.assigned_by = currentUser.user_id;
    }
    let url = API_URL;
    if (editingTask) {
      payload.individual_task_id = editingTask.individual_task_id;
      url += '?action=updateTask';
    } else {
      url += '?action=createTask';
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await res.json();
      fetchTasks();
    } catch (err) {
      console.error('Error saving task', err);
    }
    setShowModal(false);
    setEditingTask(null);
    setFormData({ priority: 'Medium', deadline: '', assignedTo: '' });
  };

  // Toggle view options for active, completed, and binned tasks
  const toggleView = (option) => {
    setViewOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  // Update a task field (for status, binning, etc.)
  const updateTaskField = async (taskId, updateData) => {
    try {
      const res = await fetch(`${API_URL}?action=updateTask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ individual_task_id: taskId, ...updateData })
      });
      await res.json();
      fetchTasks();
    } catch (err) {
      console.error('Error updating task', err);
    }
  };

  // Toggle completion status (0 = in progress, 1 = completed)
  const handleStatusChange = (task) => {
    if (parseInt(task.binned) === 1) return; // do nothing if binned
    const newStatus = parseInt(task.status) === 1 ? 0 : 1;
    updateTaskField(task.individual_task_id, { status: newStatus });
  };

  // Toggle binning state (0 or 1)
  const handleBinChange = (task) => {
    const newBinned = parseInt(task.binned) === 1 ? 0 : 1;
    updateTaskField(task.individual_task_id, { binned: newBinned });
  };

  const getEmployeeChartData = (userId) => {
    const employeeTasks = tasks.filter(t => parseInt(t.user_id) === parseInt(userId) && parseInt(t.binned) === 0);
    const completed = employeeTasks.filter(t => parseInt(t.status) === 1).length;
    const remaining = employeeTasks.filter(t => parseInt(t.status) === 0).length;
    return {
      labels: ['Completed', 'Remaining'],
      datasets: [{
        data: [completed, remaining],
        backgroundColor: ['#4CAF50', '#607D8B'],
        borderColor: ['#fff', '#fff']
      }]
    };
  };

  return (
    <Container>
      <h1 className="text-center my-4">Task Management</h1>
      
      <div className="d-flex justify-content-between mb-4">
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Create New Task
        </Button>
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

      {Object.entries(groupTasks()).map(([userId, userTasks]) => (
        <div key={userId} className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>{getUserName(userId)}</h3>
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                setSelectedUser(userId);
                setShowChart(true);
              }}
            >
              <FiPieChart className="me-2" />
              View Progress
            </Button>
          </div>
          <Row className="g-4">
            {userTasks.map(task => (
              <Col md={6} lg={6} key={task.individual_task_id} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Check 
                        type="checkbox"
                        checked={parseInt(task.status) === 1}
                        onChange={() => handleStatusChange(task)}
                        disabled={parseInt(task.binned) === 1}
                        label={task.priority + " Priority"}
                      />
                      <div className="d-flex gap-2">
                        <Button 
                          variant="link" 
                          size="sm"
                          onClick={() => {
                            setEditingTask(task);
                            setFormData({
                              priority: task.priority,
                              deadline: task.deadline,
                              assignedTo: task.user_id
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
                          onClick={() => handleBinChange(task)}
                        >
                          {parseInt(task.binned) === 1 ? <FiArchive /> : <FiTrash2 />}
                        </Button>
                      </div>
                    </div>
                    <Card.Text>
                      <small>Deadline: {new Date(task.deadline).toLocaleDateString()}</small>
                    </Card.Text>
                    <Card.Text>
                      <small>Status: {parseInt(task.binned) === 1 ? 'Binned' : (parseInt(task.status) === 1 ? 'Completed' : 'In Progress')}</small>
                    </Card.Text>
                    <Card.Text>
                      <small>Assigned by: { getUserName(task.assigned_by) }</small>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      {/* Create/Edit Task Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setEditingTask(null); }}>
        <Modal.Header closeButton>
          <Modal.Title>{editingTask ? 'Edit Task' : 'Create New Task'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Assign To</Form.Label>
              <Form.Select
                required
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                <option value="">Select Employee</option>
                {users
                  .filter(user =>
                    user.role && user.role.toLowerCase() === "employee" &&
                    parseInt(user.user_id) !== currentUser.user_id
                  )
                  .map(user => (
                    <option key={user.user_id} value={user.user_id}>{user.name}</option>
                  ))
                }
              </Form.Select>
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditingTask(null); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Progress Chart Modal */}
      <Modal show={showChart} onHide={() => setShowChart(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedUser ? getUserName(selectedUser) : ''} Task Progress</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: '300px' }}>
            {selectedUser && (
              <Pie 
                data={getEmployeeChartData(selectedUser)} 
                options={{ responsive: true, maintainAspectRatio: false }} 
              />
            )}
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ManTasks;
