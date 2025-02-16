"use client"

import { useState, useEffect, useRef } from "react"
import {
  Container,
  Button,
  Modal,
  Form,
  Card,
  Badge,
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

const API_URL = "http://35.214.101.36/ManTasks.php"
const currentUser = { user_id: 3, role: "Manager", name: "John Manager" }

const initialFormData = {
  name: "",
  priority: "Medium",
  deadline: "",
  assignedTo: "",
  description: "",
}

const priorityOptions = ["Low", "Medium", "High"]

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
  const [formData, setFormData] = useState(initialFormData)

  // Employee filter state
  const [employeeFilterText, setEmployeeFilterText] = useState("")
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [showEmployeeOptions, setShowEmployeeOptions] = useState(false)
  const employeeFilterRef = useRef(null)

  // Priority filter state (updated: static buttons with removable tags)
  // (Note: Removed the search input and related states.)
  const [selectedPriorities, setSelectedPriorities] = useState([])

  // Deadline filter state
  const [deadlineFilterStart, setDeadlineFilterStart] = useState("")
  const [deadlineFilterEnd, setDeadlineFilterEnd] = useState("")

  // Modal "Assign To" search state
  const [assignedToSearch, setAssignedToSearch] = useState("")

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "danger", // Default variant is red
  })

  const openConfirmModal = (title, message, onConfirm, variant = "danger") => {
    setConfirmModal({ show: true, title, message, onConfirm, variant })
  }

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, show: false }))
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}?action=getUsers`)
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error("Error fetching users", err)
    }
  }

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}?action=getTasks`)
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

  const filterTasksByManager = (allTasks) => {
    if (currentUser.role === "Manager") {
      return allTasks.filter(
        (task) => Number.parseInt(task.assigned_by) === currentUser.user_id,
      )
    }
    return allTasks
  }

  const groupTasks = () => {
    let filteredTasks = filterTasksByManager(tasks)
    // Apply employee filter if any selected
    if (selectedEmployees.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        selectedEmployees.includes(Number.parseInt(task.user_id)),
      )
    }
    // Apply priority filter if any selected (updated section)
    if (selectedPriorities.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        selectedPriorities.includes(task.priority),
      )
    }
    // Apply deadline filter if set
    if (deadlineFilterStart || deadlineFilterEnd) {
      filteredTasks = filteredTasks.filter((task) => {
        const taskDeadline = new Date(task.deadline)
        let startOk = true,
          endOk = true
        if (deadlineFilterStart) {
          const startDate = new Date(deadlineFilterStart)
          startOk = taskDeadline >= startDate
        }
        if (deadlineFilterEnd) {
          const endDate = new Date(deadlineFilterEnd)
          endOk = taskDeadline <= endDate
        }
        return startOk && endOk
      })
    }
    // Apply view options for active, completed, and binned
    filteredTasks = filteredTasks.filter((task) => {
      if (Number.parseInt(task.binned) === 1) {
        return viewOptions.binned
      } else {
        if (Number.parseInt(task.status) === 0 && !viewOptions.active)
          return false
        if (Number.parseInt(task.status) === 1 && !viewOptions.completed)
          return false
      }
      return true
    })
    return filteredTasks.reduce((acc, task) => {
      acc[task.user_id] = acc[task.user_id] || []
      acc[task.user_id].push(task)
      return acc
    }, {})
  }

  const getUserName = (userId) => {
    const user = users.find(
      (u) => Number.parseInt(u.user_id) === Number.parseInt(userId),
    )
    return user ? user.name : "Unknown"
  }

  // Employee Filter functions
  const addEmployee = (empId) => {
    if (!selectedEmployees.includes(empId)) {
      setSelectedEmployees((prev) => [...prev, empId])
    }
  }
  const removeEmployee = (empId) => {
    setSelectedEmployees((prev) => prev.filter((id) => id !== empId))
  }

  // Priority Filter functions (updated: static buttons)
  const addPriority = (priority) => {
    if (!selectedPriorities.includes(priority)) {
      setSelectedPriorities((prev) => [...prev, priority])
    }
  }
  const removePriority = (priority) => {
    setSelectedPriorities((prev) => prev.filter((p) => p !== priority))
  }

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
    const url =
      API_URL + (editingTask ? "?action=updateTask" : "?action=createTask")
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) {
        alert("Error saving task: " + data.error)
      }
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
      const data = await res.json()
      if (!data.success) {
        alert("Error updating task: " + data.error)
      }
      await fetchTasks()
    } catch (err) {
      console.error("Error updating task", err)
    }
  }

  const handleStatusChange = (task) => {
    if (Number.parseInt(task.binned) === 1) return
    const newStatus = Number.parseInt(task.status) === 1 ? 0 : 1
    updateTaskField(task.individual_task_id, { status: newStatus })
  }

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`${API_URL}?action=deleteTask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ individual_task_id: taskId }),
      })
      const data = await res.json()
      if (!data.success) {
        alert("Delete failed: " + data.error)
      } else {
        await fetchTasks()
      }
    } catch (err) {
      console.error("Error deleting task", err)
    }
  }

  const handleBinChange = (task) => {
    if (Number.parseInt(task.binned) === 1) return
    openConfirmModal(
      "Bin Task",
      "Are you sure you want to bin this task?",
      () => {
        updateTaskField(task.individual_task_id, { binned: 1 })
        closeConfirmModal()
      },
      "danger"
    )
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setFormData({
      name: task.name || "",
      priority: task.priority || "Medium",
      deadline: task.deadline || "",
      assignedTo: task.user_id || "",
      description: task.description || "",
    })
    setShowModal(true)
  }

  const getEmployeeChartData = (userId) => {
    const employeeTasks = tasks.filter(
      (t) =>
        Number.parseInt(t.user_id) === Number.parseInt(userId) &&
        Number.parseInt(t.binned) === 0,
    )
    const completed = employeeTasks.filter(
      (t) => Number.parseInt(t.status) === 1,
    ).length
    const remaining = employeeTasks.filter(
      (t) => Number.parseInt(t.status) === 0,
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

  const getTaskStatusColor = (task) => {
    if (Number.parseInt(task.binned) === 1) return "danger"
    if (Number.parseInt(task.status) === 1) return "success"
    return "primary"
  }

  return (
    <Container fluid className="py-5 bg-light">
      <h1 className="text-center mb-5">Task Management Dashboard</h1>

      {/* Filters Row */}
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group controlId="employeeFilter">
            <Form.Label>Filter by Employee</Form.Label>
            <div
              tabIndex="0"
              onFocus={() => setShowEmployeeOptions(true)}
              onBlur={() => setTimeout(() => setShowEmployeeOptions(false), 150)}
            >
              <Form.Control
                type="text"
                placeholder="Search employees..."
                value={employeeFilterText}
                onChange={(e) => setEmployeeFilterText(e.target.value)}
                className="mb-2"
              />
              {showEmployeeOptions && (
                <div className="list-group">
                  {users
                    .filter((user) => {
                      if (user.role.toLowerCase() === "manager") return false
                      const matchesSearch = user.name
                        .toLowerCase()
                        .includes(employeeFilterText.toLowerCase())
                      const isSelected = selectedEmployees.includes(
                        Number.parseInt(user.user_id),
                      )
                      return matchesSearch || isSelected
                    })
                    .map((user) => (
                      <Button
                        key={user.user_id}
                        variant="outline-secondary"
                        className="list-group-item list-group-item-action"
                        onClick={() => {
                          addEmployee(Number.parseInt(user.user_id))
                        }}
                      >
                        {user.name}
                      </Button>
                    ))}
                </div>
              )}
            </div>
            <div className="mt-2">
              {selectedEmployees.map((empId) => (
                <Badge key={empId} bg="primary" pill className="me-1">
                  {getUserName(empId)}{" "}
                  <Button
                    variant="link"
                    onClick={() => removeEmployee(empId)}
                    style={{
                      color: "white",
                      textDecoration: "none",
                      padding: 0,
                      fontSize: "0.8em",
                    }}
                  >
                    &times;
                  </Button>
                </Badge>
              ))}
            </div>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="priorityFilter" className="mb-3">
            <Form.Label>Filter by Priority</Form.Label>
            <div className="mt-2">
              {priorityOptions.map((option) => (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-2 mb-2"
                  key={option}
                  onClick={() => addPriority(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
            <div className="mt-2">
              {selectedPriorities.map((option) => (
                <Badge pill bg="primary" className="me-1" key={option}>
                  {option}{" "}
                  <Button
                    variant="link"
                    style={{ color: "white", padding: 0, fontSize: "0.8em" }}
                    onClick={() => removePriority(option)}
                  >
                    &times;
                  </Button>
                </Badge>
              ))}
            </div>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="deadlineFilter">
            <Form.Label>Filter by Deadline</Form.Label>
            <div className="d-flex align-items-center">
              <Form.Control
                type="date"
                placeholder="From"
                value={deadlineFilterStart}
                onChange={(e) => setDeadlineFilterStart(e.target.value)}
                className="me-2"
              />
              <Form.Control
                type="date"
                placeholder="To"
                value={deadlineFilterEnd}
                onChange={(e) => setDeadlineFilterEnd(e.target.value)}
                className="me-2"
              />
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setDeadlineFilterStart("")
                  setDeadlineFilterEnd("")
                }}
              >
                Clear
              </Button>
            </div>
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <Button
          variant="primary"
          onClick={() => {
            setEditingTask(null)
            setFormData(initialFormData)
            setAssignedToSearch("")
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
                  <Card.Header className={`bg-${getTaskStatusColor(task)} text-white`}>
                    <h5 className="mb-0">{task.name}</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <Form.Check
                        type="checkbox"
                        id={`task-${task.individual_task_id}`}
                        checked={Number.parseInt(task.status) === 1}
                        onChange={() => handleStatusChange(task)}
                        disabled={Number.parseInt(task.binned) === 1}
                      />
                      <Badge
                        bg={
                          task.priority === "High"
                            ? "danger"
                            : task.priority === "Medium"
                            ? "warning"
                            : "success"
                        }
                        className="rounded-pill px-3"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="card-text text-muted mb-2">
                      <small>Deadline: {new Date(task.deadline).toLocaleDateString()}</small>
                    </p>
                    <p className="card-text text-muted mb-3">
                      <small>
                        Status:{" "}
                        {Number.parseInt(task.binned) === 1
                          ? "Binned"
                          : Number.parseInt(task.status) === 1
                          ? "Completed"
                          : "In Progress"}
                      </small>
                    </p>
                    <p className="card-text mb-4" style={{ fontStyle: "italic", fontSize: "1.1em" }}>
                      {task.description || "No description provided"}
                    </p>
                    <p className="card-text">
                      <small className="text-muted">Assigned by: {getUserName(task.assigned_by)}</small>
                    </p>
                    <div className="d-flex gap-2">
                      <Button variant="outline-secondary" size="sm" onClick={() => handleEditTask(task)}>
                        <FiEdit />
                      </Button>
                      {Number.parseInt(task.binned) === 1 ? (
                        <>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() =>
                              openConfirmModal(
                                "Restore Task",
                                "Are you sure you want to restore this task from the bin?",
                                () => {
                                  updateTaskField(task.individual_task_id, { binned: 0 })
                                  closeConfirmModal()
                                },
                                "success"
                              )
                            }
                          >
                            Restore
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() =>
                              openConfirmModal(
                                "Delete Task",
                                "Are you sure you want to permanently delete this task?",
                                () => {
                                  handleDeleteTask(task.individual_task_id)
                                  closeConfirmModal()
                                },
                                "danger"
                              )
                            }
                          >
                            Delete
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline-danger" size="sm" onClick={() => handleBinChange(task)}>
                          <FiTrash2 />
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}

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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Assign To</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search employee..."
                value={assignedToSearch}
                onChange={(e) => setAssignedToSearch(e.target.value)}
                className="mb-2"
              />
              <Form.Select
                required
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                <option value="">Select Employee</option>
                {users
                  .filter(
                    (user) =>
                      user.role.toLowerCase() !== "manager" &&
                      user.name.toLowerCase().includes(assignedToSearch.toLowerCase()),
                  )
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
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {priorityOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
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

      <Modal show={showChart} onHide={() => setShowChart(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedUser ? getUserName(selectedUser) : ""} Task Progress</Modal.Title>
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

      {/* Confirmation Modal */}
      <Modal show={confirmModal.show} onHide={closeConfirmModal}>
        <Modal.Header closeButton>
          <Modal.Title>{confirmModal.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{confirmModal.message}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeConfirmModal}>
            Cancel
          </Button>
          <Button variant={confirmModal.variant} onClick={confirmModal.onConfirm}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default ManTasks
