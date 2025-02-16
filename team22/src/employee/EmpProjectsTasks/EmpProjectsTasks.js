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
  Form,
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
  const [teamLeaders, setTeamLeaders] = useState({});
  const isTeamLeader = (projectId) => {
    const leaderId = teamLeaders[projectId];
    console.log(`Checking isTeamLeader for project ${projectId} ->`, leaderId, "==", userId);
    return Number(leaderId) === Number(userId);
  };
  const [projectUsersTasks, setProjectUsersTasks] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState(null);

  const fetchProjectUsersTasks = async (projectId) => {
    try {
        console.log(`Fetching users and tasks for project ${projectId}...`);

        const res = await fetch(`http://35.214.101.36/ProjTasks.php?action=getAllProjectsTasks&project_id=${projectId}`);

        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }

        const text = await res.text(); // Read response as text first
        console.log("Raw response:", text);

        if (!text.trim()) {
            console.warn("Empty response received.");
            setProjectUsersTasks([]); // Set empty array instead of failing
        } else {
            const data = JSON.parse(text); // Parse response
            console.log("Fetched users and tasks:", data);
            setProjectUsersTasks(data);
        }

        setShowEditModal(true); // Ensure modal always opens

    } catch (error) {
        console.error("Error fetching project users and tasks:", error);
        setShowEditModal(true); // Open modal even if fetching fails (shows empty state)
    }
};



const ConfirmationModal = ({ show, onConfirm, onCancel, message }) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          No
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Yes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};




const EditProjectTasksModal = ({ show, handleClose, usersTasks, selectedProject, fetchProjects, 
  fetchIndividualTasks }) => {
  const [editingTask, setEditingTask] = useState(null);
  const [taskName, setTaskName] = useState("");
  const [taskStatus, setTaskStatus] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [error, setError] = useState(""); // Track validation errors

  const handleEditClick = (task) => {
    setEditingTask(task.task_id);
    setTaskName(task.task_name);
    setTaskStatus(task.status);
    setError(""); // Clear any previous errors
  };
  const handleCloseModal = () => {
    handleClose(); // Close the modal
    fetchProjects(); // Refresh projects
    fetchIndividualTasks(); // Refresh individual tasks
  };

  const handleSaveClick = async (userId, taskId, projectId) => {
    if (!taskName.trim()) {
      setError("Task name cannot be empty."); // Validation for empty task name
      return;
    }

    try {
      const res = await fetch("http://35.214.101.36/ProjTasks.php?action=editTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          project_id: projectId,
          user_id: userId,
          task_name: taskName,
          status: taskStatus,
        }),
      });

      const data = await res.json();

      if (data.success) {
        console.log("Task updated successfully:", data);
        setEditingTask(null); // Exit edit mode
        fetchProjectUsersTasks(projectId); // Refresh tasks
      } else {
        console.error("Error updating task:", data.error);
      }
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const handleDeleteClick = (taskId) => {
    setTaskToDelete(taskId); // Store the task ID to delete
    setShowDeleteModal(true); // Show the confirmation modal
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      const res = await fetch("http://35.214.101.36/ProjTasks.php?action=deleteTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskToDelete,
        }),
      });

      const data = await res.json();

      if (data.success) {
        console.log("Task deleted successfully:", data);
        // Refresh the tasks list after deletion
        fetchProjectUsersTasks(selectedProject.project_id);
      } else {
        console.error("Error deleting task:", data.error);
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    } finally {
      setShowDeleteModal(false); // Close the confirmation modal
      setTaskToDelete(null); // Reset the task to delete
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false); // Close the confirmation modal
    setTaskToDelete(null); // Reset the task to delete
  };

  const handleCancelClick = () => {
    setEditingTask(null);
    setError(""); // Clear any errors
  };

  const handleAddTaskClick = (userId) => {
    setSelectedUserId(userId); // Set the selected user ID
    setShowAddTaskForm(true); // Show the add task form
    setError(""); // Clear any previous errors
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim()) {
      setError("Task name cannot be empty."); // Validation for empty task name
      return;
    }

    try {
      const res = await fetch("http://35.214.101.36/ProjTasks.php?action=addTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: selectedProject.project_id,
          user_id: selectedUserId,
          task_name: newTaskName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        console.log("Task added successfully:", data);
        // Reset form fields
        setNewTaskName("");
        setSelectedUserId(null);
        setShowAddTaskForm(false); // Close the form
        // Refresh the tasks list
        fetchProjectUsersTasks(selectedProject.project_id);
      } else {
        console.error("Error adding task:", data.error);
      }
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  return (
    <>
      <Modal show={show} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedProject?.name} Tasks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {usersTasks.length === 0 ? (
            <p>No team members found for this project.</p>
          ) : (
            <ListGroup>
              {usersTasks.map((user) => (
                <ListGroup.Item key={user.user_id}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5>{user.name} ({user.job_title})</h5>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleAddTaskClick(user.user_id)}
                    >
                      Add Task
                    </Button>
                  </div>
                  {Array.isArray(user.tasks) && user.tasks.length > 0 ? (
                    <ul>
                      {user.tasks.map((task) => (
                        <li key={task.task_id}>
                          {editingTask === task.task_id ? (
                            <div>
                              <input
                                type="text"
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                              />
                              <select
                                value={taskStatus}
                                onChange={(e) => setTaskStatus(Number(e.target.value))}
                              >
                                <option value={0}>Pending</option>
                                <option value={1}>Completed</option>
                              </select>
                              <button onClick={() => handleSaveClick(user.user_id, task.task_id, selectedProject.project_id)}>
                                Save
                              </button>
                              <button onClick={handleCancelClick}>Cancel</button>
                              {error && <p className="text-danger">{error}</p>} {/* Show error message */}
                            </div>
                          ) : (
                            <div>
                              {task.task_name} - {task.status === 1 ? "Completed" : "Pending"}
                              <button onClick={() => handleEditClick(task)}>Edit</button>
                              <button onClick={() => handleDeleteClick(task.task_id)}>
                                Delete
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No tasks assigned</p>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Task Form Modal */}
      <Modal show={showAddTaskForm} onHide={() => setShowAddTaskForm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="taskName" className="form-label">
              Task Name
            </label>
            <input
              type="text"
              className="form-control"
              id="taskName"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
            />
            {error && <p className="text-danger">{error}</p>} {/* Show error message */}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddTaskForm(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddTask}
            disabled={!newTaskName.trim()} // Disable button if task name is empty
          >
            Save Task
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        message="Are you sure you want to delete this task?"
      />
    </>
  );
};




  
  // Fetch tasks for a specific project for the current user
  const fetchTasks = useCallback(async (projectId) => {
    try {
      console.log(`Fetching tasks for project ${projectId}...`);
  
      const res = await fetch(
        `http://35.214.101.36/ProjTasks.php?action=getTasks&project_id=${projectId}&user_id=${userId}`
      );
  
      console.log(`Tasks response status for project ${projectId}:`, res.status);
  
      const text = await res.text();
      console.log(`Raw tasks response for project ${projectId}:`, text);
  
      const data = JSON.parse(text);
      console.log(`Parsed tasks data for project ${projectId}:`, data);
  
      setTasks((prevTasks) => ({
        ...prevTasks,
        [projectId]: data.map((task) => ({
          ...task,
          status: Number(task.status), // Ensure status is a number
        })),
      }));
    } catch (err) {
      console.error(`Error fetching tasks for project ${projectId}:`, err);
    }
  }, [userId]);





  // Fetch projects assigned to the user
  const fetchProjects = useCallback(async () => {
    try {
      console.log("Fetching projects...");
      console.log("Current userId:", userId);
  
      const res = await fetch(
        `http://35.214.101.36/ProjTasks.php?action=getProjects&user_id=${userId}`
      );
  
      console.log("Projects response status:", res.status);
  
      const text = await res.text();
      console.log("Raw projects response:", text);
  
      if (!text.trim()) {
        console.error("Empty response received from the server.");
        return;
      }
  
      const data = JSON.parse(text);
      console.log("Parsed projects data:", data);
  
      // Ensure user_progress is available for each project
      const projectsWithProgress = data.map((project) => ({
        ...project,
        user_progress: project.user_progress || 0, // Default to 0 if no progress data
      }));
  
      setProjects(projectsWithProgress);
  
      // Fetch team leader for each project in parallel
      const leaderPromises = projectsWithProgress.map((project) =>
        fetchTeamLeader(project.project_id)
      );
      await Promise.all(leaderPromises); // Ensure all fetches complete before proceeding
  
      // Fetch tasks for all projects after projects are fetched
      const taskPromises = projectsWithProgress.map((project) =>
        fetchTasks(project.project_id)
      );
      await Promise.all(taskPromises); // Fetch tasks for all projects
  
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  }, [userId, fetchTasks]); // Add fetchTasks to the dependency array
  





  const fetchTeamLeader = async (projectId) => {
    try {
      console.log(`Fetching team leader for project ${projectId}...`);
      
      const res = await fetch(
        `http://35.214.101.36/ProjTasks.php?action=getTeamLeader&project_id=${projectId}`
      );
  
      const text = await res.text();
      console.log(`Raw team leader response for project ${projectId}:`, text);
  
      const data = JSON.parse(text);
      console.log(`Parsed team leader data for project ${projectId}:`, data);
  
      setTeamLeaders((prevLeaders) => {
        const updatedLeaders = {
          ...prevLeaders,
          [projectId]: Number(data.team_leader_id) || null,  // Ensure numeric comparison
        };
        console.log("Updated teamLeaders state:", JSON.stringify(updatedLeaders, null, 2)); // Better logging
        return updatedLeaders;
      });
  
    } catch (err) {
      console.error(`Error fetching team leader for project ${projectId}:`, err);
    }
  };
  
  



  // Fetch individual tasks assigned to the user
  const fetchIndividualTasks = useCallback(async () => {
    try {
      console.log("Fetching individual tasks...");
  
      const res = await fetch(
        `http://35.214.101.36/ProjTasks.php?action=getIndividualTasks&user_id=${userId}`
      );
  
      console.log("Individual tasks response status:", res.status);
  
      const text = await res.text();
      console.log("Raw individual tasks response:", text);
  
      const data = JSON.parse(text);
      console.log("Parsed individual tasks data:", data);
  
      setIndividualTasks(data);
    } catch (err) {
      console.error("Error fetching individual tasks:", err);
    }
  }, []);

  useEffect(() => {
    fetchProjects()
    fetchIndividualTasks()
  }, [fetchProjects, fetchIndividualTasks]) 

  // Toggle a task’s completion status
  const handleTaskToggle = async (projectId, taskId, currentStatus) => {
    try {
      const res = await fetch(`${"http://35.214.101.36/ProjTasks.php"}?action=updateTask`, {
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
      const res = await fetch(`${"http://35.214.101.36/ProjTasks.php"}?action=updateIndividualTask`, {
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
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    );
    if (days < 0)
      return { 
        text: <strong className="text-danger">Overdue</strong>, // Bold and red using Bootstrap
        color: "danger", 
        icon: <FiAlertCircle /> 
      };
    if (days <= 7)
      return { text: `${days} day(s) left`, color: "warning", icon: <FiClock /> };
    return { text: `${days} day(s) left`, color: "success", icon: <FiClock /> };
  };

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
                {isTeamLeader(project.project_id) ? (
                  <Badge bg="dark">Team Leader</Badge>
                ) : (
                  getTimeStatus(project.deadline).icon // Otherwise, show the overdue icon
                )}
                </Card.Header>
                <Card.Body className="d-flex flex-column">

                <div className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-2">{project.name}</Card.Title>
                  {isTeamLeader(project.project_id) && (
                    <Button variant="outline-primary" size="sm" onClick={() => {
                      setSelectedProject(project); // Store selected project
                      setShowEditModal(true); // Open modal immediately
                      fetchProjectUsersTasks(project.project_id); // Fetch data
                  }}>
                      View Tasks
                    </Button>
                  )}
                </div>

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
                      tasks[project.project_id] && tasks[project.project_id].length > 0 ? (
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
                              color: project.user_progress === 0 ? "black" : "transparent",
                              fontWeight: "bold",
                            }}
                          >
                            {project.user_progress === 0 ? "0%" : ""}
                          </div>
                          <ProgressBar
                            now={project.user_progress}
                            label={`${Math.round(project.user_progress)}%`}
                            variant={project.user_progress >= 100 ? "success" : "primary"}
                          />
                        </ProgressBar>
                      ) : (
                        <div style={{ textAlign: "center", fontWeight: "bold" }}>N/A</div>
                      )
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
                                checked={task.status === 1} // Ensure this is correctly bound to the task status
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
            {individualTasks.map((task, index) => (
              <ListGroup.Item
                key={task.individual_task_id}
                id={`individual-task-${index}`}
                className="d-flex justify-content-between align-items-start py-3 border-left border-3"
                style={{
                  borderLeftColor:
                    task.priority === "high"
                      ? "#dc3545"
                      : task.priority === "medium"
                      ? "#ffc107"
                      : "#17a2b8",
                  borderRadius: "10px",
                  marginBottom: "10px",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s ease, background-color 0.3s ease",
                  cursor: "pointer",
                  backgroundColor: task.status === 1 ? "#f8f9fa" : "transparent", // Highlight completed tasks
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <div className="ms-2 me-auto" style={{ flexGrow: 1 }}>
                  <div className="d-flex align-items-center">
                    <Form.Check
                      type="checkbox"
                      checked={task.status === 1} // Check if task is completed
                      onChange={() => handleIndividualTaskToggle(task.individual_task_id, task.status)}
                      className="me-2"
                    />
                    <h5
                      className={`mb-1 ${task.status === 1 ? "text-muted text-decoration-line-through" : ""}`}
                    >
                      {task.name}
                    </h5>
                    <Badge
                      bg={
                        task.priority === "high"
                          ? "danger"
                          : task.priority === "medium"
                          ? "warning"
                          : "info"
                      }
                      className="ms-2"
                      style={{ borderRadius: "10px", padding: "5px 10px" }}
                    >
                      {task.priority}
                    </Badge>
                    <Badge
                      bg={task.status === 1 ? "success" : "secondary"}
                      className="ms-2"
                      style={{ borderRadius: "10px", padding: "5px 10px" }}
                    >
                      {task.status === 1 ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                  <p className="mb-1 text-muted">{task.description}</p>
                  <small className="text-muted">
                    Due Date: {task.deadline || "No due date"}
                  </small>
                </div>
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

      <EditProjectTasksModal 
          show={showEditModal} 
          handleClose={() => setShowEditModal(false)} 
          usersTasks={projectUsersTasks} 
          selectedProject={selectedProject}
          fetchProjects={fetchProjects} // Pass fetchProjects
          fetchIndividualTasks={fetchIndividualTasks} // Pass fetchIndividualTasks
    />

    </Container>
  )
}

export default EmpProjectsTasks