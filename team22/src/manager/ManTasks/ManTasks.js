"use client"

import React, { useState, useEffect } from "react"
import {
  Container,
  Button,
  Modal,
  Form,
  Card,
  ButtonGroup,
  Row,
  Col,
} from "react-bootstrap"
import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import {
  FiPieChart,
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiPlus,
} from "react-icons/fi"

ChartJS.register(ArcElement, Tooltip, Legend)

// API URL pointing to our backend PHP file
const API_URL = "http://35.214.101.36/ManTasks.php"
// Example current manager info
const currentUser = { user_id: 3, role: "Manager", name: "John Manager" }

const initialFormData = {
  name: "",
  priority: "Medium",
  deadline: "",
  assignedTo: "",
  description: "",
}

const ManTasks = () => {
  const [showModal, setShowModal] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [viewOptions, setViewOptions] = useState({
    active: true,
    completed: true,
    binned: false,
  })
  // New state: an array of employee user_ids to filter tasks by.
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [formData, setFormData] = useState(initialFormData)

  // Fetch users from the backend
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}?action=getUsers&_=${Date.now()}`)
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error("Error fetching users", err)
    }
  }

  // Fetch tasks from the backend with a timestamp to bypass caching
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}?action=getTasks&_=${Date.now()}`)
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      console.error("Error fetching tasks", err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchTasks()
  }, [])

  // For managers, show only tasks assigned by the current manager
  const filterTasksByManager = (allTasks) => {
    if (currentUser.role === "Manager") {
      return allTasks.filter(
        (task) => parseInt(task.assigned_by) === currentUser.user_id
      )
    }
    return allTasks
  }

  // Group tasks by assigned user with view filtering and employee filtering applied
  const groupTasks = () => {
    // Start with tasks the manager is responsible for
    let filteredTasks = filterTasksByManager(tasks)
    // If one or more employees are selected, filter tasks accordingly.
    if (selectedEmployees.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        selectedEmployees.includes(parseInt(task.user_id))
      )
    }
    // Apply view options for active, completed, and binned
    filteredTasks = filteredTasks.filter((task) => {
      if (parseInt(task.binned) === 1) {
        return viewOptions.binned
      } else {
        if (parseInt(task.status) === 0 && !viewOptions.active) return false
        if (parseInt(task.status) === 1 && !viewOptions.completed) return false
      }
      return true
    })

    // Group tasks by user_id
    return filteredTasks.reduce((acc, task) => {
      acc[task.user_id] = acc[task.user_id] || []
      acc[task.user_id].push(task)
      return acc
    }, {})
  }

  const getUserName = (userId) => {
    const user = users.find(
      (u) => parseInt(u.user_id) === parseInt(userId)
    )
    return user ? user.name : "Unknown"
  }

  // Create or update a task
  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      user_id: formData.assignedTo,
      name: formData.name,
      priority: formData.priority,
      deadline: formData.deadline,
      description: formData.description,
    }
    if (!editingTask) {
      payload.assigned_by = currentUser.user_id
    } else {
      payload.individual_task_id = editingTask.individual_task_id
    }
    let url = API_URL + (editingTask ? "?action=updateTask" : "?action=createTask")
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      await res.json()
      await fetchTasks()
    } catch (err) {
      console.error("Error saving task", err)
    }
    setShowModal(false)
    setEditingTask(null)
    setFormData(initialFormData)
  }

  const toggleView = (option) => {
    setViewOptions((prev) => ({ ...prev, [option]: !prev[option] }))
  }

  const updateTaskField = async (taskId, updateData) => {
    try {
      const res = await fetch(`${API_URL}?action=updateTask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ individual_task_id: taskId, ...updateData }),
      })
      await res.json()
      await fetchTasks()
    } catch (err) {
      console.error("Error updating task", err)
    }
  }

  const handleStatusChange = (task) => {
    if (parseInt(task.binned) === 1) return
    const newStatus = parseInt(task.status) === 1 ? 0 : 1
    updateTaskField(task.individual_task_id, { status: newStatus })
  }

  // Permanently delete a task that is already binned
  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`${API_URL}?action=deleteTask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ individual_task_id: taskId }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchTasks()
      } else {
        alert("Delete failed: " + data.error)
      }
    } catch (err) {
      console.error("Error deleting task", err)
    }
  }

  const getEmployeeChartData = (userId) => {
    const employeeTasks = tasks.filter(
      (t) =>
        parseInt(t.user_id) === parseInt(userId) &&
        parseInt(t.binned) === 0
    )
    const completed = employeeTasks.filter(
      (t) => parseInt(t.status) === 1
    ).length
    const remaining = employeeTasks.filter(
      (t) => parseInt(t.status) === 0
    ).length
    return {
      labels: ["Completed", "Remaining"],
      datasets: [
        {
          data: [completed, remaining],
          backgroundColor: ["#28a745", "#ffc107"],
          borderColor: ["#fff", "#fff"],
        },
      ],
    }
  }

  // Handle changes in the employee filter multi-select
  const handleEmployeeFilterChange = (event) => {
    const selected = Array.from(event.target.selectedOptions, (option) =>
      parseInt(option.value)
    )
    setSelectedEmployees(selected)
  }

  return (
    <Container fluid className="py-5 bg-light">
      <h1 className="text-center mb-5">Task Management Dashboard</h1>

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <Button
          variant="primary"
          onClick={() => {
            // Clear editing state and reset form when creating new task
            setEditingTask(null)
            setFormData(initialFormData)
            setShowModal(true)
          }}
          className="rounded-pill mb-2 me-2"
        >
          <FiPlus className="me-2" /> Create New Task
        </Button>
        <ButtonGroup className="mb-2 me-2">
          <Button
            variant={viewOptions.active ? "primary" : "outline-primary"}
            onClick={() => toggleView("active")}
          >
            {viewOptions.active ? <FiEye /> : <FiEyeOff />} Active
          </Button>
          <Button
            variant={viewOptions.completed ? "success" : "outline-success"}
            onClick={() => toggleView("completed")}
          >
            {viewOptions.completed ? <FiEye /> : <FiEyeOff />} Completed
          </Button>
          <Button
            variant={viewOptions.binned ? "danger" : "outline-danger"}
            onClick={() => toggleView("binned")}
          >
            {viewOptions.binned ? <FiEye /> : <FiEyeOff />} Binned
          </Button>
        </ButtonGroup>
      </div>

      {/* Employee Filter */}
      <Form.Group controlId="employeeFilter" className="mb-4">
        <Form.Label>Filter by Employee</Form.Label>
        <Form.Select
          multiple
          onChange={handleEmployeeFilterChange}
          value={selectedEmployees}
        >
          {users
            .filter((user) => user.role.toLowerCase() !== "manager")
            .map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.name}
              </option>
            ))}
        </Form.Select>
      </Form.Group>

      {Object.entries(groupTasks()).map(([userId, userTasks]) => (
        <div key={userId} className="mb-5 bg-white p-4 rounded shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="mb-0">{getUserName(userId)}</h3>
            <Button
              variant="outline-primary"
              onClick={() => {
                setSelectedUser(userId)
                setShowChart(true)
              }}
            >
              <FiPieChart className="me-2" /> View Progress
            </Button>
          </div>
          <Row className="g-4">
            {userTasks.map((task) => (
              <Col md={6} lg={4} key={task.individual_task_id}>
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <Form.Check
                          type="checkbox"
                          id={`task-${task.individual_task_id}`}
                          checked={parseInt(task.status) === 1}
                          onChange={() => handleStatusChange(task)}
                          disabled={parseInt(task.binned) === 1}
                        />
                        <span className="ms-2 fw-bold" style={{ fontSize: "1.3em" }}>
                          {task.name}
                        </span>
                      </div>
                      <div>
                        {parseInt(task.binned) === 1 ? (
                          <>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() =>
                                updateTaskField(task.individual_task_id, { binned: 0 })
                              }
                            >
                              Restore
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="ms-2"
                              onClick={() =>
                                handleDeleteTask(task.individual_task_id)
                              }
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setEditingTask(task)
                                setFormData({
                                  name: task.name,
                                  priority: task.priority,
                                  deadline: new Date(task.deadline)
                                    .toISOString()
                                    .split("T")[0],
                                  assignedTo: task.user_id,
                                  description: task.description || "",
                                })
                                setShowModal(true)
                              }}
                            >
                              <FiEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="ms-2"
                              onClick={() =>
                                updateTaskField(task.individual_task_id, { binned: 1 })
                              }
                            >
                              <FiTrash2 />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2">
                        <small className="text-muted">
                          Deadline: {new Date(task.deadline).toLocaleDateString()}
                        </small>
                      </p>
                      <p className="mb-2">
                        <small className="text-muted">
                          Status:{" "}
                          {parseInt(task.binned) === 1
                            ? "Binned"
                            : parseInt(task.status) === 1
                            ? "Completed"
                            : "In Progress"}
                        </small>
                      </p>
                      <p className="mb-2" style={{ fontStyle: "italic", fontSize: "1.1em" }}>
                        {task.description || "No description provided"}
                      </p>
                      <p className="mb-0">
                        <small className="text-muted">
                          Assigned by: {getUserName(task.assigned_by)}
                        </small>
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      {/* Task Creation/Edit Modal */}
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false)
          setEditingTask(null)
        }}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingTask ? "Edit Task" : "Create New Task"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Task Name</Form.Label>
              <Form.Control
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Assign To</Form.Label>
              <Form.Select
                required
                value={formData.assignedTo}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTo: e.target.value })
                }
              >
                <option value="">Select Employee</option>
                {users
                  .filter((user) => user.role && user.role.toLowerCase() !== "manager")
                  .map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.name}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Priority Level</Form.Label>
              <Form.Select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingTask(null)
              }}
            >
              Close
            </Button>
            <Button variant="primary" type="submit">
              {editingTask ? "Save Changes" : "Create Task"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Task Progress Chart Modal */}
      <Modal show={showChart} onHide={() => setShowChart(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedUser ? getUserName(selectedUser) : ""} Task Progress
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: "300px" }}>
            {selectedUser && (
              <Pie
                data={getEmployeeChartData(selectedUser)}
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
            )}
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  )
}

export default ManTasks