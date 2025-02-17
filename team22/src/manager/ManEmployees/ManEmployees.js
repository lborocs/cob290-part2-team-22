"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Table,
  Button,
  Form,
  Modal,
  InputGroup,
  Dropdown,
  DropdownButton,
  Row,
  Col,
  OverlayTrigger,
  Tooltip,
  Card,
} from "react-bootstrap"
import { FiEye, FiSearch, FiFilter, FiArrowDown, FiPieChart, FiBarChart2 } from "react-icons/fi"
import { FaExclamationTriangle } from "react-icons/fa"
import { Pie, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js"

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement)

const API_URL = "http://35.214.101.36/ManEmployees.php"
const currentUser = { user_id: 3, role: "Manager", name: "John Manager" }

// Define constants for warning colors
const WARNING_COLORS = {
  DANGER: "#dc3545",
  WARNING: "#ffc107",
  ORANGE: "#fd7e14",
  INFO: "#17a2b8",
  SECONDARY: "#6c757d",
}

const warningStyles = `
  .table-warning-danger { background-color: rgba(220, 53, 69, 0.1); }
  .table-warning-warning { background-color: rgba(255, 193, 7, 0.1); }
  .table-warning-orange { background-color: rgba(253, 126, 20, 0.1); }
  .table-warning-info { background-color: rgba(23, 162, 184, 0.1); }
`

const getRowWarningClass = (warnings) => {
  if (warnings.length === 0) return ""
  const highestPriorityWarning = warnings.reduce((prev, current) => {
    const order = ["tasksOver15", "tasksDueSoon", "tasksOver7", "projectsOver3"]
    return order.indexOf(prev.type) < order.indexOf(current.type) ? prev : current
  })
  switch (highestPriorityWarning.type) {
    case "tasksOver15":
      return "table-warning-danger"
    case "tasksDueSoon":
      return "table-warning-orange"
    case "tasksOver7":
      return "table-warning-warning"
    case "projectsOver3":
      return "table-warning-info"
    default:
      return ""
  }
}

const ManEmployees = () => {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("name")
  const [sortType, setSortType] = useState(null)
  const [editJobTitle, setEditJobTitle] = useState("")
  const [editSkills, setEditSkills] = useState("")
  const [showSkillsChart, setShowSkillsChart] = useState(false)
  const [showTaskAllocationChart, setShowTaskAllocationChart] = useState(false)
  const [showProjectTaskAllocationChart, setShowProjectTaskAllocationChart] = useState(false)
  const [showWarningsChart, setShowWarningsChart] = useState(false)

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}?action=getEmployees`)
      const data = await res.json()
      setEmployees(data)
      setFilteredEmployees(data)
    } catch (err) {
      console.error("Error fetching employees", err)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    const filtered = employees.filter((emp) => emp[filterType]?.toLowerCase().includes(searchQuery.toLowerCase()))

    if (sortType === "individualTasks") {
      filtered.sort((a, b) => b.individualTasks - a.individualTasks)
    } else if (sortType === "projectTasksAssigned") {
      filtered.sort((a, b) => b.projectTasksAssigned - a.projectTasksAssigned)
    } else if (sortType === "projectsAssigned") {
      filtered.sort((a, b) => b.projectsAssigned - a.projectsAssigned)
    }

    setFilteredEmployees(filtered)
  }, [searchQuery, filterType, employees, sortType])

  const getWarnings = (emp) => {
    const warnings = []
    if (emp.individualTasks > 15) {
      warnings.push({
        message:
          "Severe Warning: Employee has more than 15 individual tasks assigned. This indicates an excessive workload that may lead to burnout, significant delays, and quality issues.",
        type: "tasksOver15",
      })
    } else if (emp.individualTasks > 7) {
      warnings.push({
        message:
          "Warning: Employee has more than 7 individual tasks assigned. This workload could start affecting efficiency and may require closer monitoring to prevent overload.",
        type: "tasksOver7",
      })
    }
    if (emp.tasksDueSoon >= 5) {
      warnings.push({
        message:
          "Urgent Warning: Employee has 5 or more tasks due within the next 2 days. This suggests critical upcoming deadlines that, if not managed properly, could result in missed targets.",
        type: "tasksDueSoon",
      })
    }
    if (emp.projectsAssigned > 3) {
      warnings.push({
        message:
          "Notice: Employee is involved in more than 3 projects. This divided focus may reduce overall effectiveness and increase the risk of errors.",
        type: "projectsOver3",
      })
    }
    return warnings
  }

  const getWarningIconColor = (type) => {
    switch (type) {
      case "tasksOver15":
        return "#dc3545" // Bootstrap danger (red)
      case "tasksOver7":
        return "#ffc107" // Bootstrap warning (yellow)
      case "tasksDueSoon":
        return "#fd7e14" // Bootstrap orange
      case "projectsOver3":
        return "#17a2b8" // Bootstrap info (blue)
      default:
        return "#6c757d" // Bootstrap secondary (gray)
    }
  }

  const handleShowModal = (emp) => {
    setSelectedEmployee(emp)
    setEditJobTitle(emp.job_title)
    setEditSkills(emp.skills)
    setShowModal(true)
  }

  const handleSaveChanges = async () => {
    if (!selectedEmployee) return
    try {
      const response = await fetch(`${API_URL}?action=updateEmployee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedEmployee.user_id,
          job_title: editJobTitle,
          skills: editSkills,
        }),
      })
      const resData = await response.json()
      if (response.ok && resData.success) {
        fetchEmployees()
        setShowModal(false)
      } else {
        console.error("Failed to update employee", resData)
      }
    } catch (err) {
      console.error("Error updating employee", err)
    }
  }

  const processSkillsData = () => {
    const skillCounts = {}
    employees.forEach((emp) => {
      if (emp.skills) {
        emp.skills.split(", ").forEach((skill) => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1
        })
      }
    })
    return {
      labels: Object.keys(skillCounts),
      datasets: [
        {
          data: Object.values(skillCounts),
          backgroundColor: [
            "#007bff",
            "#28a745",
            WARNING_COLORS.WARNING,
            "#17a2b8",
            "#dc3545",
            "#6610f2",
            "#fd7e14",
            "#20c997",
            "#e83e8c",
            "#6f42c1",
            "#28a745",
            "#17a2b8",
          ],
        },
      ],
    }
  }

  const processTaskData = () => {
    const topEmployees = [...employees].sort((a, b) => b.individualTasks - a.individualTasks).slice(0, 5)

    return {
      labels: topEmployees.map((emp) => emp.name),
      datasets: [
        {
          label: "Individual Tasks",
          data: topEmployees.map((emp) => emp.individualTasks),
          backgroundColor: topEmployees.map((emp) => {
            if (emp.individualTasks > 15) return WARNING_COLORS.DANGER
            else if (emp.individualTasks > 7) return WARNING_COLORS.WARNING
            else return "#007bff" // Bootstrap primary
          }),
        },
      ],
    }
  }

  const processProjectTaskData = () => {
    const topEmployees = [...employees].sort((a, b) => b.projectTasksAssigned - a.projectTasksAssigned).slice(0, 5)

    return {
      labels: topEmployees.map((emp) => emp.name),
      datasets: [
        {
          label: "Project Tasks",
          data: topEmployees.map((emp) => emp.projectTasksAssigned),
          backgroundColor: topEmployees.map((emp) => {
            if (emp.projectTasksAssigned > 15) return WARNING_COLORS.DANGER
            else if (emp.projectTasksAssigned > 7) return WARNING_COLORS.WARNING
            else return "#28a745" // Bootstrap success
          }),
        },
      ],
    }
  }

  const processWarningChartData = () => {
    let tasksOver7Count = 0
    let tasksOver15Count = 0
    let tasksDueSoonCount = 0
    let projectsOver3Count = 0
    employees.forEach((emp) => {
      if (emp.individualTasks > 15) {
        tasksOver15Count++
      } else if (emp.individualTasks > 7) {
        tasksOver7Count++
      }
      if (emp.tasksDueSoon >= 5) {
        tasksDueSoonCount++
      }
      if (emp.projectsAssigned > 3) {
        projectsOver3Count++
      }
    })
    return {
      labels: [">7 Tasks", ">15 Tasks", "5+ Tasks Due Soon", ">3 Projects"],
      datasets: [
        {
          label: "Warning Counts",
          data: [tasksOver7Count, tasksOver15Count, tasksDueSoonCount, projectsOver3Count],
          backgroundColor: [WARNING_COLORS.WARNING, WARNING_COLORS.DANGER, WARNING_COLORS.ORANGE, WARNING_COLORS.INFO],
        },
      ],
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, []) // Removed employees from the dependency array

  return (
    <Container fluid className="py-4 bg-light">
      <style>{warningStyles}</style>
      <h1 className="text-center mb-4">Manager's Employee Overview</h1>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="mb-3">
            <Col md={3}>
              <Button variant="primary" className="w-100 mb-2" onClick={() => setShowSkillsChart(true)}>
                <FiPieChart className="me-2" /> Skills Distribution
              </Button>
            </Col>
            <Col md={3}>
              <Button variant="primary" className="w-100 mb-2" onClick={() => setShowTaskAllocationChart(true)}>
                <FiBarChart2 className="me-2" /> Individual Task Allocation
              </Button>
            </Col>
            <Col md={3}>
              <Button variant="primary" className="w-100 mb-2" onClick={() => setShowProjectTaskAllocationChart(true)}>
                <FiBarChart2 className="me-2" /> Project Task Allocation
              </Button>
            </Col>
            <Col md={3}>
              <Button variant="primary" className="w-100 mb-2" onClick={() => setShowWarningsChart(true)}>
                <FaExclamationTriangle className="me-2" /> Warnings Overview
              </Button>
            </Col>
          </Row>

          <InputGroup className="mb-3">
            <InputGroup.Text>
              <FiSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder={`Search by ${filterType}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <DropdownButton
              as={InputGroup.Append}
              variant="outline-secondary"
              title={
                <>
                  <FiFilter /> Filter
                </>
              }
            >
              <Dropdown.Item onClick={() => setFilterType("name")}>Name</Dropdown.Item>
              <Dropdown.Item onClick={() => setFilterType("job_title")}>Job Title</Dropdown.Item>
              <Dropdown.Item onClick={() => setFilterType("skills")}>Skills</Dropdown.Item>
            </DropdownButton>
            <DropdownButton
              as={InputGroup.Append}
              variant="outline-secondary"
              title={
                <>
                  <FiArrowDown /> Sort
                </>
              }
            >
              <Dropdown.Item onClick={() => setSortType(null)}>Default</Dropdown.Item>
              <Dropdown.Item onClick={() => setSortType("individualTasks")}>Most Individual Tasks</Dropdown.Item>
              <Dropdown.Item onClick={() => setSortType("projectTasksAssigned")}>Most Project Tasks</Dropdown.Item>
              <Dropdown.Item onClick={() => setSortType("projectsAssigned")}>Most Projects Assigned</Dropdown.Item>
            </DropdownButton>
          </InputGroup>

          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="bg-primary text-white">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Job Title</th>
                  <th>Skills</th>
                  <th>Individual Tasks</th>
                  <th>Project Tasks</th>
                  <th>Tasks Completed</th>
                  <th>Projects Assigned</th>
                  <th>Warnings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const warnings = getWarnings(emp)
                  return (
                    <tr key={emp.user_id} className={getRowWarningClass(warnings)}>
                      <td>{emp.user_id}</td>
                      <td>{emp.name}</td>
                      <td>{emp.job_title}</td>
                      <td>{emp.skills}</td>
                      <td>{emp.individualTasks}</td>
                      <td>{emp.projectTasksAssigned}</td>
                      <td>{emp.tasksCompleted}</td>
                      <td>{emp.projectsAssigned}</td>
                      <td>
                        {warnings.map((warning, index) => (
                          <OverlayTrigger key={index} placement="top" overlay={<Tooltip>{warning.message}</Tooltip>}>
                            <span className="me-1">
                              <FaExclamationTriangle
                                style={{ color: getWarningIconColor(warning.type), cursor: "pointer" }}
                              />
                            </span>
                          </OverlayTrigger>
                        ))}
                      </td>
                      <td>
                        <Button
                          variant={warnings.length > 0 ? "warning" : "primary"}
                          size="sm"
                          onClick={() => handleShowModal(emp)}
                        >
                          <FiEye /> View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Skills Distribution Modal */}
      <Modal show={showSkillsChart} onHide={() => setShowSkillsChart(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Skills Distribution</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: "400px" }}>
            <Pie
              data={processSkillsData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      boxWidth: 12,
                    },
                  },
                },
              }}
            />
          </div>
        </Modal.Body>
      </Modal>

      {/* Individual Task Allocation Modal */}
      <Modal show={showTaskAllocationChart} onHide={() => setShowTaskAllocationChart(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Individual Task Allocation (Top 5)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: "400px" }}>
            <Bar
              data={processTaskData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </Modal.Body>
      </Modal>

      {/* Project Task Allocation Modal */}
      <Modal show={showProjectTaskAllocationChart} onHide={() => setShowProjectTaskAllocationChart(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Project Task Allocation (Top 5)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: "400px" }}>
            <Bar
              data={processProjectTaskData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </Modal.Body>
      </Modal>

      {/* Warnings Overview Modal */}
      <Modal show={showWarningsChart} onHide={() => setShowWarningsChart(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Warnings Overview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: "400px" }}>
            <Bar
              data={processWarningChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </Modal.Body>
      </Modal>

      {/* Employee Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Employee Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmployee && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Job Title</Form.Label>
                <Form.Control type="text" value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Skills (comma separated)</Form.Label>
                <Form.Control type="text" value={editSkills} onChange={(e) => setEditSkills(e.target.value)} />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default ManEmployees

