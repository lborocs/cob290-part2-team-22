"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Container,
  Button,
  Card,
  Badge,
  ButtonGroup,
  ProgressBar,
  ListGroup,
  Modal,
  Row,
  Col,
} from "react-bootstrap"
import {
  FiEye,
  FiEyeOff,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiPieChart,
  FiUser,
  FiUsers,
} from "react-icons/fi"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Pie } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend)


const EmpProjectsTasks = ( {userId} ) => {
  const [expandedProjects, setExpandedProjects] = useState({})
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState({})
  const [individualTasks, setIndividualTasks] = useState([])
  const [viewOptions, setViewOptions] = useState({
    active: true,
    completed: false,
  })
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressView, setProgressView] = useState({})

  // Fetch projects assigned to the user
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(
        `${"http://35.214.101.36/EmpProjectsTasks.php"}?action=getProjects&user_id=${userId}`
      )
      const data = await res.json()
      console.log("Fetched projects:", data)
      setProjects(data)
      const initialProgressView = {}
      data.forEach((project) => {
        initialProgressView[project.project_id] = "user"
      })
      setProgressView(initialProgressView)
    } catch (err) {
      console.error("Error fetching projects:", err)
    }
  }, [])

  // Fetch tasks for a specific project for the current user
  const fetchTasks = useCallback(async (projectId) => {
    try {
      const res = await fetch(
        `${"http://35.214.101.36/EmpProjectsTasks.php"}?action=getTasks&project_id=${projectId}&user_id=${userId}`
      )
      const data = await res.json()
      console.log("Fetched tasks for project", projectId, ":", data)
      setTasks((prevTasks) => ({
        ...prevTasks,
        [projectId]: data,
      }))
    } catch (err) {
      console.error("Error fetching tasks:", err)
    }
  }, [])

  // Fetch individual tasks assigned to the user
  const fetchIndividualTasks = useCallback(async () => {
    try {
      const res = await fetch(
        `${"http://35.214.101.36/EmpProjectsTasks.php"}?action=getIndividualTasks&user_id=${userId}`
      )
      const data = await res.json()
      console.log("Fetched individual tasks:", data)
      setIndividualTasks(data)
    } catch (err) {
      console.error("Error fetching individual tasks:", err)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
    fetchIndividualTasks()
  }, [fetchProjects, fetchIndividualTasks])

  // Toggle a task’s completion status
  const handleTaskToggle = async (projectId, taskId, currentStatus) => {
    try {
      const res = await fetch(`${"http://35.214.101.36/EmpProjectsTasks.php"}?action=updateTask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          user_id: userId,
          status: currentStatus === 1 ? 0 : 1,
        }),
      })
      const data = await res.json()

      if (data.success) {
        console.log("Task updated successfully:", data)
        setTasks((prevTasks) => ({
          ...prevTasks,
          [projectId]: prevTasks[projectId].map((task) =>
            task.task_id === taskId
              ? { ...task, status: currentStatus === 1 ? 0 : 1 }
              : task
          ),
        }))

        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project.project_id === projectId
              ? {
                  ...project,
                  team_progress: data.team_progress,
                  user_progress: data.user_progress,
                }
              : project
          )
        )
      } else {
        console.error("Error updating task:", data.error)
      }
    } catch (err) {
      console.error("Error updating task:", err)
    }
  }

  // Toggle individual task completion status
  const handleIndividualTaskToggle = async (taskId, currentStatus) => {
    try {
      const res = await fetch(`${"http://35.214.101.36/EmpProjectsTasks.php"}?action=updateIndividualTask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          user_id: userId,
          status: currentStatus === 1 ? 0 : 1,
        }),
      })
      const data = await res.json()

      if (data.success) {
        console.log("Individual task updated successfully:", data)
        setIndividualTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.individual_task_id === taskId
              ? { ...task, status: currentStatus === 1 ? 0 : 1 }
              : task
          )
        )
      } else {
        console.error("Error updating individual task:", data.error)
      }
    } catch (err) {
      console.error("Error updating individual task:", err)
    }
  }

  const toggleView = (option) => {
    setViewOptions((prev) => ({ ...prev, [option]: !prev[option] }))
  }

  const toggleProgressView = (projectId) => {
    setProgressView((prev) => ({
      ...prev,
      [projectId]: prev[projectId] === "user" ? "team" : "user",
    }))
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
    const days = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) /
        (1000 * 3600 * 24)
    )
    if (days < 0)
      return { text: "Overdue", color: "danger", icon: <FiAlertCircle /> }
    if (days <= 7)
      return { text: `${days} day(s) left`, color: "warning", icon: <FiClock /> }
    return { text: `${days} day(s) left`, color: "success", icon: <FiClock /> }
  }

  const getChartData = () => {
    const labels = projects.map((project) => project.name)
    const data = projects.map((project) => project.team_progress)
    const backgroundColors = projects.map(
      () =>
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
          Math.random() * 255
        )}, ${Math.floor(Math.random() * 255)}, 0.6)`
    )

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map((color) => color.replace("0.6", "1")),
          borderWidth: 1,
        },
      ],
    }
  }

  return (
    <Container fluid className="py-4 px-4">
      <h1 className="text-center mb-4">My Projects and Tasks</h1>

      <div className="d-flex justify-content-between mb-4">
        <Button variant="info" onClick={() => setShowProgressModal(true)}>
          <FiPieChart className="me-2" />
          View All Projects Progress
        </Button>
        <ButtonGroup>
          <Button
            variant={viewOptions.active ? "primary" : "secondary"}
            onClick={() => toggleView("active")}
          >
            {viewOptions.active ? <FiEye /> : <FiEyeOff />} Active Projects
          </Button>
          <Button
            variant={viewOptions.completed ? "success" : "secondary"}
            onClick={() => toggleView("completed")}
          >
            {viewOptions.completed ? <FiEye /> : <FiEyeOff />} Completed Projects
          </Button>
        </ButtonGroup>
      </div>

      <Row>
        {projects
          .filter((project) => {
            if (project.completed === 1) {
              return viewOptions.completed
            } else {
              return viewOptions.active
            }
          })
          .map((project) => (
            <Col xs={12} md={6} lg={4} key={project.project_id} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                  <Badge bg={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                  {getTimeStatus(project.deadline).icon}
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="mb-2">{project.name}</Card.Title>
                  <Card.Text className="text-muted small mb-2">
                    {project.description}
                  </Card.Text>
                  <Card.Text className="text-muted small mb-3">
                    {getTimeStatus(project.deadline).text}
                  </Card.Text>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>
                        {progressView[project.project_id] === "user"
                          ? "Your Progress"
                          : "Team Progress"}
                      </span>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => toggleProgressView(project.project_id)}
                      >
                        {progressView[project.project_id] === "user" ? (
                          <FiUsers />
                        ) : (
                          <FiUser />
                        )}
                      </Button>
                    </div>
                    {progressView[project.project_id] === "user" ? (
                      <ProgressBar
                        now={project.user_progress}
                        variant={project.user_progress >= 100 ? "success" : "primary"}
                        style={{ position: "relative" }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            color:
                              !tasks[project.project_id] || tasks[project.project_id].length === 0
                                ? "black"
                                : "transparent",
                            fontWeight: "bold",
                          }}
                        >
                          N/A
                        </div>
                        <ProgressBar
                          now={project.user_progress}
                          label={
                            tasks[project.project_id] && tasks[project.project_id].length > 0
                              ? `${Math.round(project.user_progress)}%`
                              : ""
                          }
                          variant={project.user_progress >= 100 ? "success" : "primary"}
                        />
                      </ProgressBar>
                    ) : (
                      <ProgressBar
                        now={project.team_progress}
                        label={`${Math.round(project.team_progress)}%`}
                        variant={project.team_progress >= 100 ? "success" : "primary"}
                      />
                    )}
                  </div>

                  <Button
                    variant="outline-primary"
                    className="mt-auto"
                    onClick={() => {
                      setExpandedProjects((prev) => ({
                        ...prev,
                        [project.project_id]:
                          !prev[project.project_id],
                      }))
                      if (!tasks[project.project_id]) {
                        fetchTasks(project.project_id)
                      }
                    }}
                  >
                    {expandedProjects[project.project_id]
                      ? "Hide Tasks"
                      : "View My Tasks"}
                  </Button>

                  {expandedProjects[project.project_id] &&
                    tasks[project.project_id] && (
                      <ListGroup className="mt-3">
                        {tasks[project.project_id].length > 0 ? (
                          tasks[project.project_id].map((task) => (
                            <ListGroup.Item
                              key={task.task_id}
                              className="d-flex justify-content-between align-items-center"
                            >
                              <div className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={task.status === 1}
                                  onChange={() =>
                                    handleTaskToggle(
                                      project.project_id,
                                      task.task_id,
                                      task.status
                                    )
                                  }
                                  id={`task-${task.task_id}`}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor={`task-${task.task_id}`}
                                >
                                  {task.task_name}
                                </label>
                              </div>
                              {task.status === 1 && (
                                <FiCheckCircle className="text-success" />
                              )}
                            </ListGroup.Item>
                          ))
                        ) : (
                          <ListGroup.Item>
                            No tasks assigned to you for this project.
                          </ListGroup.Item>
                        )}
                      </ListGroup>
                    )}
                </Card.Body>
              </Card>
            </Col>
          ))}
      </Row>

      {/* Individual Tasks Section */}
      <Row className="mt-4">
        <Col xs={12}>
          <h2>Individual Tasks</h2>
          <ListGroup>
            {individualTasks.map((task) => (
              <ListGroup.Item
                key={task.individual_task_id}
                className="d-flex justify-content-between align-items-center"
              >
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={task.status === 1}
                    onChange={() =>
                      handleIndividualTaskToggle(
                        task.individual_task_id,
                        task.status
                      )
                    }
                    id={`individual-task-${task.individual_task_id}`}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`individual-task-${task.individual_task_id}`}
                  >
                    {task.name}
                  </label>
                </div>
                {task.status === 1 && (
                  <FiCheckCircle className="text-success" />
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>

      <Modal
        show={showProgressModal}
        onHide={() => setShowProgressModal(false)}
        size="lg"
      >
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
                <ListGroup.Item
                  key={project.project_id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{project.name}</strong>
                    <Badge
                      bg={getPriorityColor(project.priority)}
                      className="ms-2"
                    >
                      {project.priority}
                    </Badge>
                  </div>
                  <div>
                    Your Progress: {Math.round(project.user_progress)}%
                    <ProgressBar
                      now={project.user_progress}
                      variant={
                        project.user_progress >= 100 ? "success" : "primary"
                      }
                      style={{
                        width: "100px",
                        height: "10px",
                        display: "inline-block",
                        marginLeft: "10px",
                      }}
                    />
                  </div>
                  <div>
                    Team Progress: {Math.round(project.team_progress)}%
                    <ProgressBar
                      now={project.team_progress}
                      variant={
                        project.team_progress >= 100 ? "success" : "primary"
                      }
                      style={{
                        width: "100px",
                        height: "10px",
                        display: "inline-block",
                        marginLeft: "10px",
                      }}
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