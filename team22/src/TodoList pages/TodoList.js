"use client"

import "bootstrap/dist/css/bootstrap.min.css"
import { useState, useEffect } from "react"
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  ListGroup,
  Modal,
  Badge,
  ButtonGroup,
  Dropdown,
  Card,
} from "react-bootstrap"
import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import TodoProgressCharts from "./TodoProgressCharts"

// Configure the calendar localizer
const localizer = momentLocalizer(moment)

function TodoList({ userId }) {
  const [todos, setTodos] = useState([])
  const [selectedTodos, setSelectedTodos] = useState([]);
  const [deletedTodos, setDeletedTodos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBinModal, setShowBinModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false)
  const [deleteIndex, setDeleteIndex] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)
  const [selectedBinItems, setSelectedBinItems] = useState([])
  const [showCharts, setShowCharts] = useState(false)
  const [filters, setFilters] = useState({
    priority: "all",
    status: "all",
  })

  const [newTodo, setNewTodo] = useState({
    name: "",
    description: "",
    status: "pending",
    priority: "low",
    dueDate: "",
  })

  // Fetch todos from the backend
  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const response = await fetch(`http://35.214.101.36/ToDoList.php?user_id=${userId}`)
      const data = await response.json()
      const formattedData = data.map((task) => ({
        ...task,
        name: task.title || "",
        dueDate: task.due_date || "",
        status: task.status?.toLowerCase() || "pending",
        priority: task.priority?.toLowerCase() || "low",
      }))
      setTodos(formattedData)
    } catch (error) {
      console.error("Error fetching todos:", error)
    }
  }

  // Format todos as events for the calendar
  const getCalendarEvents = () => {
    return todos.map((todo) => ({
      id: todo.todo_id,
      title: todo.name,
      start: todo.dueDate ? new Date(todo.dueDate) : new Date(),
      end: todo.dueDate ? new Date(todo.dueDate) : new Date(),
      allDay: true,
      status: todo.status,
      priority: todo.priority,
    }))
  }

  // Custom event component for the calendar
  const EventComponent = ({ event }) => {
    const [isHovered, setIsHovered] = useState(false)

    const getPriorityColor = (priority) => {
      switch (priority) {
        case "high":
          return "#dc3545" // Red
        case "medium":
          return "#ffc107" // Yellow
        default:
          return "#17a2b8" // Blue
      }
    }

    return (
      <div
        style={{
          padding: "5px",
          background: getPriorityColor(event.priority),
          color: "#fff",
          borderRadius: "4px",
          border: "none",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          cursor: "pointer",
          transition: "all 0.3s ease",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative", // Needed for the pop-up bubble
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          // Find the corresponding task in the todo list
          const taskIndex = todos.findIndex((todo) => todo.todo_id === event.id)
          if (taskIndex !== -1) {
            // Highlight the task in the list
            const taskElement = document.getElementById(`todo-${taskIndex}`)
            if (taskElement) {
              taskElement.style.transform = "scale(1.1)"
              setTimeout(() => {
                taskElement.style.transform = "scale(1)"
              }, 300)
            }
          }
        }}
      >
        {/* Pop-up bubble for event name */}
        {isHovered && (
          <div
            style={{
              position: "absolute",
              top: "-30px", // Position above the event block
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0, 0, 0, 0.8)",
              color: "#fff",
              padding: "5px 10px",
              borderRadius: "4px",
              fontSize: "12px",
              whiteSpace: "nowrap", // Prevent text from wrapping
              zIndex: 1000, // Ensure it appears above other elements
            }}
          >
            {event.title}
          </div>
        )}
      </div>
    )
  }

  const handleClose = () => {
    setShowModal(false)
    setEditingIndex(null)
    setNewTodo({
      name: "",
      description: "",
      status: "pending",
      priority: "low",
    })
  }

  const handleShow = (index) => {
    if (index !== undefined) {
      const task = todos[index]
      setEditingIndex(index)
      setNewTodo({
        name: task.name,
        description: task.description,
        status: task.status?.toLowerCase() || "pending",
        priority: task.priority?.toLowerCase() || "low",
        dueDate: task.dueDate,
        todo_id: task.todo_id,
      })
    } else {
      setNewTodo({
        name: "",
        description: "",
        status: "pending",
        priority: "low",
        dueDate: "",
      })
    }
    setShowModal(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewTodo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!newTodo.name || !newTodo.name.trim()) {
      console.error("Task name is required.")
      return
    }

    const method = editingIndex !== null ? "PUT" : "POST"
    const payload = {
      todo_id: editingIndex !== null ? todos[editingIndex].todo_id : undefined,
      user_id: userId,
      title: newTodo.name,
      description: newTodo.description,
      status: newTodo.status.charAt(0).toUpperCase() + newTodo.status.slice(1),
      priority: newTodo.priority.charAt(0).toUpperCase() + newTodo.priority.slice(1),
      due_date: newTodo.dueDate,
    }

    try {
      const response = await fetch("http://35.214.101.36/ToDoList.php", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        if (editingIndex !== null) {
          const updatedTodos = [...todos]
          updatedTodos[editingIndex] = {
            ...updatedTodos[editingIndex],
            name: newTodo.name,
            description: newTodo.description,
            status: newTodo.status,
            priority: newTodo.priority,
            dueDate: newTodo.dueDate,
          }
          setTodos(updatedTodos)
        } else {
          const newTask = {
            todo_id: Date.now(),
            name: newTodo.name,
            description: newTodo.description,
            status: newTodo.status,
            priority: newTodo.priority,
            dueDate: newTodo.dueDate,
          }
          setTodos([...todos, newTask])
        }
        handleClose()
        fetchTodos()
      } else {
        console.error("Error saving task:", response.statusText)
      }
    } catch (error) {
      console.error("Error saving task:", error)
    }
  }


  const handleTodoSelect = async (index) => {
    const updatedTodo = { ...todos[index] };
    updatedTodo.status = selectedTodos.includes(index) ? "pending" : "completed";
  
    try {
      // Update the todo status in the backend
      await fetch("http://35.214.101.36/ToDoList.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          todo_id: updatedTodo.todo_id,
          status: updatedTodo.status.charAt(0).toUpperCase() + updatedTodo.status.slice(1),
        }),
      });
  
      // Update the todo status in the local state
      const updatedTodos = [...todos];
      updatedTodos[index] = updatedTodo;
      setTodos(updatedTodos);
  
      // Toggle the selection state
      setSelectedTodos((prev) => {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index); // Deselect if already selected
        }
        return [...prev, index]; // Select if not already selected
      });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };



  const toggleTodo = async (index) => {
    const updatedTodo = { ...todos[index] }
    updatedTodo.status = updatedTodo.status === "completed" ? "pending" : "completed"

    try {
      await fetch("http://35.214.101.36/ToDoList.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          todo_id: updatedTodo.todo_id,
          status: updatedTodo.status.charAt(0).toUpperCase() + updatedTodo.status.slice(1),
        }),
      })

      const updatedTodos = [...todos]
      updatedTodos[index] = updatedTodo
      setTodos(updatedTodos)
    } catch (error) {
      console.error("Error updating task status:", error)
    }
  }

  const confirmDelete = async () => {
    if (deleteIndex !== null) {
      const todoId = todos[deleteIndex].todo_id
      try {
        await fetch("http://35.214.101.36/ToDoList.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ todo_id: todoId }),
        })
        const deletedTodo = todos[deleteIndex]
        setDeletedTodos([...deletedTodos, { ...deletedTodo, deletedAt: new Date() }])
        fetchTodos()
        handleCloseDeleteModal()
      } catch (error) {
        console.error("Error deleting task:", error)
      }
    }
  }

  const handleBinItemSelect = (index) => {
    setSelectedBinItems((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index); // Deselect if already selected
      }
      return [...prev, index]; // Select if not already selected
    });
  };

  const handleRestoreConfirm = async () => {
    const itemsToRestore = selectedBinItems.map((index) => deletedTodos[index])

    try {
      for (const task of itemsToRestore) {
        await fetch("http://35.214.101.36/ToDoList.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            todo_id: task.todo_id,
            user_id: userId,
            title: task.name,
            description: task.description,
            status: task.status.charAt(0).toUpperCase() + task.status.slice(1),
            priority: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
            due_date: task.dueDate,
          }),
        })
      }

      setTodos([...todos, ...itemsToRestore])
      setDeletedTodos(deletedTodos.filter((_, index) => !selectedBinItems.includes(index)))
      setSelectedBinItems([])
      setShowRestoreModal(false)
      setShowBinModal(false)
    } catch (error) {
      console.error("Error restoring tasks:", error)
    }
  }

  const handlePermanentDeleteConfirm = () => {
    setDeletedTodos(deletedTodos.filter((_, index) => !selectedBinItems.includes(index)))
    setSelectedBinItems([])
    setShowPermanentDeleteModal(false)
  }

  const handleShowDeleteModal = (index) => {
    setDeleteIndex(index)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setDeleteIndex(null)
    setShowDeleteModal(false)
  }

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case "high":
        return "danger"
      case "medium":
        return "warning"
      default:
        return "info"
    }
  }

  const filteredTodos = todos.filter((todo) => {
    const priorityMatch = filters.priority === "all" || todo.priority === filters.priority.toLowerCase()
    const statusMatch = filters.status === "all" || todo.status === filters.status.toLowerCase()
    return priorityMatch && statusMatch
  })

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
  }

  return (
    <Container className="mt-5" style={{ maxWidth: "1400px" }}>
      <Row>
        {/* Todo List Section */}
        <Col md={8}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="display-4" style={{ fontWeight: "600", color: "#2c3e50" }}>
              To-do List
            </h1>
            <div>
              <Button
                variant="outline-primary"
                className="me-2"
                onClick={() => setShowCharts(!showCharts)}
                style={{ borderRadius: "20px", padding: "8px 20px", fontWeight: "500" }}
              >
                {showCharts ? "List View" : "Charts View"}
              </Button>
              <Button
                variant="outline-secondary"
                className="me-2"
                onClick={() => setShowBinModal(true)}
                style={{ borderRadius: "20px", padding: "8px 20px", fontWeight: "500" }}
              >
                🗑️ Bin ({deletedTodos.length})
              </Button>
              <Button
                variant="primary"
                onClick={() => handleShow()}
                style={{ borderRadius: "20px", padding: "8px 20px", fontWeight: "500" }}
              >
                Add New Task
              </Button>
            </div>
          </div>

          {showCharts ? (
            <TodoProgressCharts userId={userId} />
          ) : (
            <>
              <div className="mb-4 d-flex gap-3">
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-primary"
                    style={{ borderRadius: "20px", padding: "8px 20px", fontWeight: "500" }}
                  >
                    Priority: {filters.priority === "all" ? "All" : filters.priority}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleFilterChange("priority", "all")}>All</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleFilterChange("priority", "low")}>Low</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleFilterChange("priority", "medium")}>Medium</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleFilterChange("priority", "high")}>High</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>

                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-primary"
                    style={{ borderRadius: "20px", padding: "8px 20px", fontWeight: "500" }}
                  >
                    Status: {filters.status === "all" ? "All" : filters.status}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleFilterChange("status", "all")}>All</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleFilterChange("status", "pending")}>Pending</Dropdown.Item>
                    <Dropdown.Item onClick={() => handleFilterChange("status", "completed")}>Completed</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              <ListGroup>
                {filteredTodos.map((todo, index) => (
                    <ListGroup.Item
                    key={index}
                    id={`todo-${index}`}
                    className="d-flex justify-content-between align-items-start py-3 border-left border-3"
                    style={{
                        borderLeftColor:
                        todo.priority === "high" ? "#dc3545" : todo.priority === "medium" ? "#ffc107" : "#17a2b8",
                        borderRadius: "10px",
                        marginBottom: "10px",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.3s ease, background-color 0.3s ease",
                        cursor: "pointer",
                        backgroundColor: selectedTodos.includes(index) ? "#f8f9fa" : "transparent", // Highlight selected items
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    onClick={() => handleTodoSelect(index)} // Toggle selection on click
                    >
                    <div className="ms-2 me-auto" style={{ flexGrow: 1 }}>
                        <div className="d-flex align-items-center">
                        <Form.Check
                            type="checkbox"
                            checked={selectedTodos.includes(index)}
                            onChange={() => handleTodoSelect(index)}
                            className="me-2"
                        />
                        <h5
                            className={`mb-1 ${todo.status === "completed" ? "text-muted text-decoration-line-through" : ""}`}
                        >
                            {todo.name}
                        </h5>
                        <Badge
                            bg={getPriorityBadgeVariant(todo.priority)}
                            className="ms-2"
                            style={{ borderRadius: "10px", padding: "5px 10px" }}
                        >
                            {todo.priority}
                        </Badge>
                        <Badge
                            bg={todo.status === "completed" ? "success" : "secondary"}
                            className="ms-2"
                            style={{ borderRadius: "10px", padding: "5px 10px" }}
                        >
                            {todo.status}
                        </Badge>
                        </div>
                        <p className="mb-1 text-muted">{todo.description}</p>
                        <small className="text-muted">Due Date: {todo.dueDate || "No due date"}</small>
                    </div>
                    <ButtonGroup>
                        <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent the click from toggling selection
                            handleShow(index);
                        }}
                        className="me-2"
                        style={{ borderRadius: "20px", padding: "5px 15px" }}
                        >
                        Edit
                        </Button>
                        <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent the click from toggling selection
                            handleShowDeleteModal(index);
                        }}
                        style={{ borderRadius: "20px", padding: "5px 15px" }}
                        >
                        Delete
                        </Button>
                    </ButtonGroup>
                    </ListGroup.Item>
                ))}
                </ListGroup>
            </>
          )}
        </Col>

        {/* Calendar Section */}
        <Col md={4}>
          <Card
            className="mb-4"
            style={{
              borderRadius: "15px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              border: "none",
            }}
          >
            <Card.Body>
              <h5
                className="mb-3"
                style={{
                  fontWeight: "600",
                  color: "#2c3e50",
                  textAlign: "center",
                }}
              >
                Upcoming Todos
              </h5>
              <Calendar
                localizer={localizer}
                events={getCalendarEvents()}
                startAccessor="start"
                endAccessor="end"
                style={{
                  height: "500px",
                  borderRadius: "10px",
                  padding: "10px",
                  background: "#f8f9fa",
                }}
                components={{
                  event: EventComponent,
                }}
                defaultView="month"
                views={["month", "week", "day"]}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: event.status === "completed" ? "#4CAF50" : "#2196F3",
                    borderRadius: "8px",
                    border: "none",
                    color: "#fff",
                    padding: "5px",
                  },
                })}
                tooltipAccessor={(event) => `${event.title} - ${event.priority}`}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modals */}
      <Modal show={showModal} onHide={handleClose} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>{editingIndex !== null ? "Edit Task" : "Add New Task"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Task Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newTodo.name}
                onChange={handleInputChange}
                placeholder="Enter task name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={newTodo.description}
                onChange={handleInputChange}
                placeholder="Enter task description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={newTodo.status} onChange={handleInputChange}>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select name="priority" value={newTodo.priority} onChange={handleInputChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control type="date" name="dueDate" value={newTodo.dueDate} onChange={handleInputChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {editingIndex !== null ? "Save Changes" : "Add Task"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showBinModal}
        onHide={() => {
          setShowBinModal(false)
          setSelectedBinItems([])
        }}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Recycle Bin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <ListGroup>
            {deletedTodos.map((todo, index) => (
                <ListGroup.Item
                key={index}
                className="d-flex justify-content-between align-items-center"
                style={{
                    cursor: "pointer",
                    backgroundColor: selectedBinItems.includes(index) ? "#f8f9fa" : "transparent",
                    transition: "background-color 0.3s ease",
                }}
                onClick={() => handleBinItemSelect(index)} // Toggle selection on click
                >
                <div className="d-flex align-items-center">
                    <Form.Check
                    type="checkbox"
                    checked={selectedBinItems.includes(index)}
                    onChange={() => handleBinItemSelect(index)}
                    className="me-3"
                    />
                    <div>
                    <h6 className="mb-1">{todo.name}</h6>
                    <small className="text-muted">
                        Deleted: {new Date(todo.deletedAt).toLocaleDateString()}
                    </small>
                    </div>
                </div>
                <div>
                    <Badge bg={getPriorityBadgeVariant(todo.priority)} className="me-2">
                    {todo.priority}
                    </Badge>
                    <Badge bg={todo.status === "completed" ? "success" : "secondary"}>
                    {todo.status}
                    </Badge>
                </div>
                </ListGroup.Item>
            ))}
            </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" disabled={selectedBinItems.length === 0} onClick={() => setShowRestoreModal(true)}>
            Restore Selected
          </Button>
          <Button
            variant="danger"
            disabled={selectedBinItems.length === 0}
            onClick={() => setShowPermanentDeleteModal(true)}
          >
            Delete Permanently
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showRestoreModal} onHide={() => setShowRestoreModal(false)} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Restore</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to restore {selectedBinItems.length} selected task(s)?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleRestoreConfirm}>
            Restore
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showPermanentDeleteModal}
        onHide={() => setShowPermanentDeleteModal(false)}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Permanent Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to permanently delete {selectedBinItems.length} selected task(s)? This action cannot be
          undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPermanentDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handlePermanentDeleteConfirm}>
            Delete Permanently
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this task?
          {deleteIndex !== null && (
            <div className="mt-3">
              <strong>Task: </strong> {todos[deleteIndex].name}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete Task
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default TodoList

