"use client"

import { useState, useEffect, useCallback } from "react"
import { Container, Button, Card, Badge, ButtonGroup, ProgressBar, ListGroup, Modal } from "react-bootstrap"
import { Row, Col } from "antd"
import { FiEye, FiEyeOff, FiClock, FiCheckCircle, FiAlertCircle, FiPieChart } from "react-icons/fi"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Pie } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend)

const API_URL = "http://35.214.101.36/EmpProjectsTasks.php"

// Example current employee info - replace with actual user authentication
const currentUser = { user_id: 2, role: "Employee", name: "Alice Smith" }

const EmpProjectsTasks = () => {
  const [selectedProject, setSelectedProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [viewOptions, setViewOptions] = useState({
    active: true,
    completed: false,
  })
  const [showProgressModal, setShowProgressModal] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}?action=getProjects&user_id=${currentUser.user_id}`)
      const data = await res.json()
      console.log("Fetched projects:", data)
      setProjects(data)
    } catch (err) {
      console.error("Error fetching projects:", err)
    }
  }, [])

  const fetchTasks = async (projectId) => {
    try {
      const res = await fetch(`${API_URL}?action=getTasks&project_id=${projectId}&user_id=${currentUser.user_id}`)
      const data = await res.json()
      console.log("Fetched tasks for project", projectId, ":", data)
      setTasks(data)
    } catch (err) {
      console.error("Error fetching tasks:", err)
    }
  }

  const checkProjectAssociation = async (projectId) => {
    try {
      const res = await fetch(
        `${API_URL}?action=checkProjectAssociation&project_id=${projectId}&user_id=${currentUser.user_id}`,
      )
      const data = await res.json()
      console.log("Project association check:", data)
      return data.isAssociated
    } catch (err) {
      console.error("Error checking project association:", err)
      return false
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleTaskToggle = async (taskId, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}?action=updateTask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          user_id: currentUser.user_id,
          status: currentStatus === 1 ? 0 : 1,
        }),
      })
      const data = await res.json()

      if (data.success) {
        console.log("Task updated successfully:", data)
        fetchTasks(selectedProject)
        fetchProjects()
      } else {
        console.error("Error updating task:", data.error)
      }
    } catch (err) {
      console.error("Error updating task:", err)
    }
  }

  const toggleView = (option) => {
    setViewOptions((prev) => ({ ...prev, [option]: !prev[option] }))
  }

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "danger"
      case "medium":
        return "warning"
      case "low":
        return "success"
      default:
        return "primary"
    }
  }

  const getTimeStatus = (deadline) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    if (days < 0) return { text: "Overdue", color: "danger", icon: <FiAlertCircle /> }
    if (days <= 7) return { text: `${days} days left`, color: "warning", icon: <FiClock /> }
    return { text: `${days} days left`, color: "success", icon: <FiClock /> }
  }

  const getChartData = () => {
    const labels = projects.map((project) => project.name)
    const data = projects.map((project) => project.progress)
    const backgroundColors = projects.map(
      () =>
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`,
    )

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map((color) => color.replace("0.6", "1")),
          borderWidth: 1,
        },
      ],
    }
  }

  return (
    <Container className="py-4">
      <h1 className="text-center mb-4">My Projects and Tasks</h1>

      <div className="d-flex justify-content-between mb-4">
        <Button variant="info" onClick={() => setShowProgressModal(true)}>
          <FiPieChart className="me-2" />
          View All Projects Progress
        </Button>
        <ButtonGroup>
          <Button variant={viewOptions.active ? "primary" : "secondary"} onClick={() => toggleView("active")}>
            {viewOptions.active ? <FiEye /> : <FiEyeOff />} Active Projects
          </Button>
          <Button variant={viewOptions.completed ? "success" : "secondary"} onClick={() => toggleView("completed")}>
            {viewOptions.completed ? <FiEye /> : <FiEyeOff />} Completed Projects
          </Button>
        </ButtonGroup>
      </div>

      <Row gutter={[16, 16]}>
        {projects
          .filter((project) => {
            if (project.completed === 1) {
              return viewOptions.completed
            } else {
              return viewOptions.active
            }
          })
          .map((project) => (
            <Col xs={24} md={12} lg={8} key={project.project_id}>
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <Badge bg={getPriorityColor(project.priority)}>{project.priority}</Badge>
                  {getTimeStatus(project.deadline).icon}
                </Card.Header>
                <Card.Body>
                  <Card.Title>{project.name}</Card.Title>
                  <Card.Text className="text-muted small">{getTimeStatus(project.deadline).text}</Card.Text>

                  <ProgressBar
                    now={project.progress}
                    label={`${Math.round(project.progress)}%`}
                    variant={project.progress === 100 ? "success" : "primary"}
                    className="mb-3"
                  />

                  <Button
                    variant="outline-primary"
                    className="w-100"
                    onClick={async () => {
                      const isAssociated = await checkProjectAssociation(project.project_id)
                      if (isAssociated) {
                        setSelectedProject(project.project_id)
                        fetchTasks(project.project_id)
                      } else {
                        console.log("User is not associated with this project")
                        // You can add a notification here to inform the user
                      }
                    }}
                  >
                    View My Tasks
                  </Button>

                  {selectedProject === project.project_id && (
                    <ListGroup className="mt-3">
                      {tasks.map((task) => (
                        <ListGroup.Item
                          key={task.task_id}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={task.status === 1}
                              onChange={() => handleTaskToggle(task.task_id, task.status)}
                              id={`task-${task.task_id}`}
                            />
                            <label className="form-check-label" htmlFor={`task-${task.task_id}`}>
                              {task.task_name}
                            </label>
                          </div>
                          {task.status === 1 && <FiCheckCircle className="text-success" />}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
      </Row>

      <Modal show={showProgressModal} onHide={() => setShowProgressModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>All Projects Progress</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: "400px" }}>
            <Pie data={getChartData()} options={{ maintainAspectRatio: false }} />
          </div>
          <div className="mt-4">
            <h5>Project Details:</h5>
            <ListGroup>
              {projects.map((project) => (
                <ListGroup.Item key={project.project_id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{project.name}</strong>
                    <Badge bg={getPriorityColor(project.priority)} className="ms-2">
                      {project.priority}
                    </Badge>
                  </div>
                  <div>
                    Progress: {Math.round(project.progress)}%
                    <ProgressBar
                      now={project.progress}
                      variant={project.progress === 100 ? "success" : "primary"}
                      style={{ width: "100px", height: "10px", display: "inline-block", marginLeft: "10px" }}
                    />
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  )
}

export default EmpProjectsTasks

