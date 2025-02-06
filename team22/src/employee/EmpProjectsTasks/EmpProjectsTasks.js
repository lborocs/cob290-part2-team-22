import React, { useState } from 'react';
import { Container, Row, Col, Card, ProgressBar, ListGroup, Badge, Form, Button, ButtonGroup, Modal } from 'react-bootstrap';
import { FiEye, FiEyeOff, FiPieChart } from 'react-icons/fi';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const employees = [
  'Micheal Jones',
  'Alice Smith',
  'Emma Khan',
  'Tom Clark',
  'Raj Patel'
];

const EmpProjectsTasks = () => {
  // For demonstration purposes, we hardcode the current employee.
  // In a real application, you would get this from your auth/user context.
  const currentEmployee = 'Alice Smith';

  const [viewOptions, setViewOptions] = useState({
    active: true,
    completed: true,
  });

  const [projects, setProjects] = useState([
    {
      id: 1,
      projectName: 'Project Alpha',
      teamLeader: 'Micheal Jones',
      employees: ['Alice Smith', 'Raj Patel'],
      priority: 'High',
      deadline: '2023-12-31',
      description: 'This is a sample project.',
      status: 'active',
      progress: 50,
      tasks: [
        { id: 1, name: 'Task 1', assignee: 'Alice Smith', completed: false },
        { id: 2, name: 'Task 2', assignee: 'Raj Patel', completed: true },
      ],
    },
    // Add more projects as needed
  ]);

  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Toggle the visibility of active/completed projects
  const toggleView = (option) => {
    setViewOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const calculateTimeLeft = (deadline) => {
    const diff = new Date(deadline) - new Date();
    if (diff < 0) return 'Overdue';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} days left`;
  };

  // Group projects by their status (active or completed)
  const groupProjectsByStatus = () => {
    return projects.reduce((acc, project) => {
      acc[project.status] = acc[project.status] || [];
      acc[project.status].push(project);
      return acc;
    }, {});
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'success';
      default: return 'primary';
    }
  };

  // This handler toggles the task's completion status and updates the project's progress and status.
  const handleTaskToggle = (projectId, taskId) => {
    setProjects(prevProjects =>
      prevProjects.map(project => {
        if (project.id === projectId) {
          // Toggle the task's completion state.
          const updatedTasks = project.tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, completed: !task.completed };
            }
            return task;
          });
          // Calculate new progress.
          const completedCount = updatedTasks.filter(task => task.completed).length;
          const newProgress = updatedTasks.length > 0 ? (completedCount / updatedTasks.length) * 100 : 0;
          // If all tasks are completed, update the project status.
          const newStatus = completedCount === updatedTasks.length ? 'completed' : 'active';
          return { ...project, tasks: updatedTasks, progress: newProgress, status: newStatus };
        }
        return project;
      })
    );
  };

  // Generate chart data for a project
  const getChartData = (project) => {
    const completedTasks = project.tasks.filter(task => task.completed).length;
    const remainingTasks = project.tasks.length - completedTasks;

    return {
      labels: ['Completed Tasks', 'Remaining Tasks'],
      datasets: [
        {
          data: [completedTasks, remainingTasks],
          backgroundColor: ['#4CAF50', '#607D8B'],
          borderColor: ['#fff', '#fff'],
        },
      ],
    };
  };

  return (
    <Container>
      <h1 className="text-center my-4">My Projects and Tasks</h1>
      
      <div className="d-flex justify-content-end mb-4">
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
                      <Card.Title className="fs-5 m-0">{project.projectName}</Card.Title>

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
                            setShowChartModal(true);
                          }}
                        >
                          <FiPieChart />
                        </Button>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <Badge bg={
                          project.priority === 'High'
                            ? 'danger'
                            : project.priority === 'Medium'
                            ? 'warning'
                            : 'success'
                        }>
                          {project.priority} Priority
                        </Badge>
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
                                label={task.name}
                                // Only allow toggling if the task is assigned to the current employee.
                                onChange={() => handleTaskToggle(project.id, task.id)}
                                disabled={task.assignee !== currentEmployee}
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

      {/* Progress Chart Modal */}
      <Modal show={showChartModal} onHide={() => setShowChartModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedProject?.projectName} Progress</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProject && (
            <div style={{ height: '300px' }}>
              <Pie 
                data={getChartData(selectedProject)} 
                options={{ 
                  responsive: true,
                  maintainAspectRatio: false,
                }} 
              />
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default EmpProjectsTasks;