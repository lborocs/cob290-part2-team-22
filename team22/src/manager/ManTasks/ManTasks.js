import React, { useState } from 'react';
import { Container, Button, Modal, Form, Card, ListGroup, Badge, ButtonGroup } from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';
import { Row, Col } from "antd";
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

const ManTasks = () => {
  const [showModal, setShowModal] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [viewOptions, setViewOptions] = useState({
    active: true,
    completed: true,
    binned: false
  });
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    priority: 'Medium',
    deadline: '',
    assignedTo: '',
    status: 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTask) {
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? { ...formData, id: editingTask.id } : task
      ));
    } else {
      const newTask = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, newTask]);
    }
    setShowModal(false);
    setEditingTask(null);
    setFormData({
      description: '',
      priority: 'Medium',
      deadline: '',
      assignedTo: '',
      status: 'active'
    });
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
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

  const groupTasks = () => {
    return tasks.reduce((acc, task) => {
      if (
        (task.status === 'active' && viewOptions.active) ||
        (task.status === 'completed' && viewOptions.completed) ||
        (task.status === 'binned' && viewOptions.binned)
      ) {
        acc[task.assignedTo] = acc[task.assignedTo] || [];
        acc[task.assignedTo].push(task);
      }
      return acc;
    }, {});
  };

  const getEmployeeChartData = (employee) => {
    const employeeTasks = tasks.filter(t => t.assignedTo === employee);
    const completed = employeeTasks.filter(t => t.status === 'completed').length;
    const remaining = employeeTasks.filter(t => t.status === 'active').length;
    
    return {
      labels: ['Completed', 'Remaining'],
      datasets: [{
        data: [completed, remaining],
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

      {Object.entries(groupTasks()).map(([employee, tasks]) => (
        <div key={employee} className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>{employee}</h3>
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                setSelectedEmployee(employee);
                setShowChart(true);
              }}
            >
              <FiPieChart className="me-2" />
              View Progress
            </Button>
          </div>
          <Row className="g-4">
            {tasks.map(task => (
              <Col md={6} lg={6} key={task.id} className="mb-4">
                <Card className={`h-100 border-3 border-${getStatusBadge(task.status)} shadow-sm`}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <Card.Title className="m-0">
                        <Form.Check 
                          type="checkbox"
                          checked={task.status === 'completed'}
                          onChange={() => handleStatusChange(
                            task.id, 
                            task.status === 'completed' ? 'active' : 'completed'
                          )}
                          label={task.description}
                          disabled={task.status === 'binned'}
                        />
                      </Card.Title>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="link" 
                          size="sm"
                          onClick={() => {
                            setEditingTask(task);
                            setFormData(task);
                            setShowModal(true);
                          }}
                        >
                          <FiEdit />
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-danger"
                          onClick={() => handleStatusChange(
                            task.id, 
                            task.status === 'binned' ? 'active' : 'binned'
                          )}
                        >
                          {task.status === 'binned' ? <FiArchive /> : <FiTrash2 />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <Badge bg={
                        task.priority === 'High' ? 'danger' :
                        task.priority === 'Medium' ? 'warning' : 'success'
                      }>
                        {task.priority}
                      </Badge>
                      <small className={
                        new Date(task.deadline) < new Date() ? 'text-danger' : 'text-success'
                      }>
                        {calculateTimeLeft(task.deadline)}
                      </small>
                    </div>
                    
                    <div className="mt-2">
                      <small className="text-muted d-block">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      {/* Task Edit/Create Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setEditingTask(null);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>{editingTask ? 'Edit Task' : 'Create New Task'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Assign To</Form.Label>
              <Form.Select
                required
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                <option value="">Select Employee</option>
                {employees.map((employee, index) => (
                  <option key={index} value={employee}>{employee}</option>
                ))}
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
            <Button variant="secondary" onClick={() => {
              setShowModal(false);
              setEditingTask(null);
            }}>
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
          <Modal.Title>{selectedEmployee}'s Task Progress</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: '300px' }}>
            <Pie 
              data={getEmployeeChartData(selectedEmployee)} 
              options={{ 
                responsive: true,
                maintainAspectRatio: false
              }} 
            />
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ManTasks;