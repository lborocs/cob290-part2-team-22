import 'bootstrap/dist/css/bootstrap.min.css';
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
    Dropdown
} from 'react-bootstrap';
import TodoProgressCharts from './TodoProgressCharts';
import React, { useState } from 'react';
import { useEffect } from 'react';

function TodoList({ userId }) {
    const [todos, setTodos] = useState([]);
    const [deletedTodos, setDeletedTodos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBinModal, setShowBinModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [selectedBinItems, setSelectedBinItems] = useState([]);
    const [showCharts, setShowCharts] = useState(false);
    const [filters, setFilters] = useState({
        priority: 'all',
        status: 'all'
    });

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const response = await fetch(`http://35.214.101.36/ToDoList.php?user_id=${userId}`);
            const data = await response.json();
    
            // Map database fields to match the state keys
            const formattedData = data.map(task => ({
                ...task,
                name: task.title || '',        // Map 'title' to 'name'
                dueDate: task.due_date || '',  // Map 'due_date' to 'dueDate'
            }));
    
            setTodos(formattedData);
        } catch (error) {
            console.error('Error fetching todos:', error);
        }
    };
    
    

    const [newTodo, setNewTodo] = useState({
        name: '',          // Ensure 'name' key exists
        description: '',
        status: 'pending',
        priority: 'low',
        dueDate: ''
    });
    

    const handleClose = () => {
        setShowModal(false);
        setEditingIndex(null);
        setNewTodo({
            name: '',
            description: '',
            status: 'pending',
            priority: 'low'
        });
    };

    const handleShow = (index) => {
        if (index !== undefined) {
            const task = todos[index];
            setEditingIndex(index);
            setNewTodo({
                name: task.name,               // Use 'name' instead of 'title'
                description: task.description,
                status: task.status?.toLowerCase() || 'pending',
                priority: task.priority?.toLowerCase() || 'low',
                dueDate: task.dueDate,         // Use 'dueDate' instead of 'due_date'
                todo_id: task.todo_id
            });
        } else {
            setNewTodo({
                name: '',
                description: '',
                status: 'pending',
                priority: 'low',
                dueDate: ''
            });
        }
        setShowModal(true);
    };
    

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTodo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        if (!newTodo.name || !newTodo.name.trim()) {
            console.error('Task name is required.');
            return;
        }
    
        const method = editingIndex !== null ? 'PUT' : 'POST';
        const payload = {
            todo_id: editingIndex !== null ? todos[editingIndex].todo_id : undefined,
            user_id: userId, // Replace with actual user ID if dynamic
            title: newTodo.name,
            description: newTodo.description,
            status: newTodo.status.charAt(0).toUpperCase() + newTodo.status.slice(1),
            priority: newTodo.priority.charAt(0).toUpperCase() + newTodo.priority.slice(1),
            due_date: newTodo.dueDate
        };
    
        try {
            await fetch('http://35.214.101.36/ToDoList.php', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            fetchTodos(); // Refresh the task list
            handleClose();
        } catch (error) {
            console.error('Error saving task:', error);
        }
    };
    





    const toggleTodo = async (index) => {
        const updatedTodo = { ...todos[index] };
        updatedTodo.status = updatedTodo.status === 'Completed' ? 'Pending' : 'Completed';
        
        try {
            await fetch('http://35.214.101.36/ToDoList.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    todo_id: updatedTodo.todo_id,
                    status: updatedTodo.status
                })
            });
            fetchTodos(); // Refresh the task list
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };
    // const toggleTodo = (index) => {
    //     const newTodos = [...todos];
    //     newTodos[index].completed = !newTodos[index].completed;
    //     newTodos[index].status = newTodos[index].completed ? 'completed' : 'pending';
    //     setTodos(newTodos);
    // };

    const confirmDelete = async () => {
        if (deleteIndex !== null) {
            const todoId = todos[deleteIndex].todo_id;
            try {
                await fetch('http://35.214.101.36/ToDoList.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ todo_id: todoId })
                });
                fetchTodos(); // Refresh the task list
                handleCloseDeleteModal();
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    };
    

  // New bin-related handlers
  const handleBinItemSelect = (index) => {
      setSelectedBinItems(prev => {
          if (prev.includes(index)) {
              return prev.filter(i => i !== index);
          }
          return [...prev, index];
      });
  };

  const handleRestoreConfirm = () => {
      const itemsToRestore = selectedBinItems.map(index => deletedTodos[index]);
      setTodos([...todos, ...itemsToRestore]);
      setDeletedTodos(deletedTodos.filter((_, index) => !selectedBinItems.includes(index)));
      setSelectedBinItems([]);
      setShowRestoreModal(false);
      setShowBinModal(false);
  };

  const handlePermanentDeleteConfirm = () => {
      setDeletedTodos(deletedTodos.filter((_, index) => !selectedBinItems.includes(index)));
      setSelectedBinItems([]);
      setShowPermanentDeleteModal(false);
  };

    // New functions for delete confirmation
    const handleShowDeleteModal = (index) => {
        setDeleteIndex(index);
        setShowDeleteModal(true);
    };

    const handleCloseDeleteModal = () => {
        setDeleteIndex(null);
        setShowDeleteModal(false);
    };


    const getPriorityBadgeVariant = (priority) => {
        switch (priority) {
            case 'high':
                return 'danger';
            case 'medium':
                return 'warning';
            default:
                return 'info';
        }
    };

    const filteredTodos = todos.filter(todo => {
        const priorityMatch = filters.priority === 'all' || todo.priority === filters.priority;
        const statusMatch = filters.status === 'all' || todo.status === filters.status;
        return priorityMatch && statusMatch;
    });

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };




    

    // return (
    //     <Container className="mt-5">
    //     <Row className="justify-content-md-center">
    //         <Col md={8}>
    //             <div className="d-flex justify-content-between align-items-center mb-4">
    //                 <h1>To-do List</h1>
    //                 <div>
    //                     <Button 
    //                         variant="outline-secondary" 
    //                         className="me-2"
    //                         onClick={() => setShowCharts(!showCharts)}
    //                     >
    //                     {showCharts ? 'List View' : 'Charts View'}
    //                     </Button>
    //                     <Button 
    //                         variant="outline-secondary" 
    //                         className="me-2"
    //                         onClick={() => setShowBinModal(true)}
    //                     >
    //                         🗑️ Bin ({deletedTodos.length})
    //                     </Button>
    //                     <Button variant="primary" onClick={() => handleShow()}>
    //                         Add New Task
    //                     </Button>
    //                 </div>
    //             </div>

    //             {showCharts ? (
    //                 <TodoProgressCharts userId={userId} />
    //             ) : (
    //               <>

    //             {/* Filters */}
    //             <div className="mb-4 d-flex gap-3">
    //                 <Dropdown>
    //                     <Dropdown.Toggle variant="outline-secondary">
    //                         Priority: {filters.priority === 'all' ? 'All' : filters.priority}
    //                     </Dropdown.Toggle>
    //                     <Dropdown.Menu>
    //                         <Dropdown.Item onClick={() => handleFilterChange('priority', 'all')}>All</Dropdown.Item>
    //                         <Dropdown.Item onClick={() => handleFilterChange('priority', 'low')}>Low</Dropdown.Item>
    //                         <Dropdown.Item onClick={() => handleFilterChange('priority', 'medium')}>Medium</Dropdown.Item>
    //                         <Dropdown.Item onClick={() => handleFilterChange('priority', 'high')}>High</Dropdown.Item>
    //                     </Dropdown.Menu>
    //                 </Dropdown>

    //                 <Dropdown>
    //                     <Dropdown.Toggle variant="outline-secondary">
    //                         Status: {filters.status === 'all' ? 'All' : filters.status}
    //                     </Dropdown.Toggle>
    //                     <Dropdown.Menu>
    //                         <Dropdown.Item onClick={() => handleFilterChange('status', 'all')}>All</Dropdown.Item>
    //                         <Dropdown.Item onClick={() => handleFilterChange('status', 'pending')}>Pending</Dropdown.Item>
    //                         <Dropdown.Item onClick={() => handleFilterChange('status', 'completed')}>Completed</Dropdown.Item>
    //                     </Dropdown.Menu>
    //                 </Dropdown>
    //             </div>

    //             <ListGroup>
    //                 {filteredTodos.map((todo, index) => (
    //                     <ListGroup.Item 
    //                         key={index} 
    //                         className="d-flex justify-content-between align-items-start py-3"
    //                     >
    //                         <div className="ms-2 me-auto" style={{ flexGrow: 1 }}>
    //                             <div className="d-flex align-items-center">
    //                                 <span 
    //                                     style={{ 
    //                                         textDecoration: todo.completed ? 'line-through' : 'none',
    //                                         cursor: 'pointer',
    //                                         marginRight: '10px'
    //                                     }}
    //                                     onClick={() => toggleTodo(index)}
    //                                 >
    //                                     <h5 className="mb-1">{todo.name}</h5>
    //                                 </span>
    //                                 <Badge 
    //                                     bg={getPriorityBadgeVariant(todo.priority)}
    //                                     className="me-2"
    //                                 >
    //                                     {todo.priority}
    //                                 </Badge>
    //                                 <Badge 
    //                                     bg={todo.status === 'completed' ? 'success' : 'secondary'}
    //                                 >
    //                                     {todo.status}
    //                                 </Badge>
    //                             </div>
    //                             <p className="mb-1 text-muted">{todo.description}</p>
    //                             <small className="text-muted">
    //                                 Due Date: {todo.dueDate || 'No due date'}
    //                             </small>
    //                         </div>
    //                         <ButtonGroup>
    //                             <Button 
    //                                 variant="outline-primary" 
    //                                 size="sm" 
    //                                 onClick={() => handleShow(index)}
    //                                 className="me-2"
    //                             >
    //                                 Edit
    //                             </Button>
    //                             <Button 
    //                                 variant="outline-danger" 
    //                                 size="sm" 
    //                                 onClick={() => handleShowDeleteModal(index)}
    //                             >
    //                                 Delete
    //                             </Button>
    //                         </ButtonGroup>
    //                     </ListGroup.Item>
    //                 ))}
    //             </ListGroup>
    //             </>
    //             )}

    return (
        <Container className="mt-5">
            <Row className="justify-content-md-center">
                <Col md={10}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="display-4">To-do List</h1>
                        <div>
                            <Button 
                                variant="outline-primary" 
                                className="me-2"
                                onClick={() => setShowCharts(!showCharts)}
                            >
                                {showCharts ? 'List View' : 'Charts View'}
                            </Button>
                            <Button 
                                variant="outline-secondary" 
                                className="me-2"
                                onClick={() => setShowBinModal(true)}
                            >
                                🗑️ Bin ({deletedTodos.length})
                            </Button>
                            <Button variant="primary" onClick={() => handleShow()}>
                                Add New Task
                            </Button>
                        </div>
                    </div>

                    {showCharts ? (
                        <TodoProgressCharts userId={userId} />
                    ) : (
                        <>
                            {/* Filters */}
                            <div className="mb-4 d-flex gap-3">
                                <Dropdown>
                                    <Dropdown.Toggle variant="outline-primary">
                                        Priority: {filters.priority === 'all' ? 'All' : filters.priority}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={() => handleFilterChange('priority', 'all')}>All</Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleFilterChange('priority', 'low')}>Low</Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleFilterChange('priority', 'medium')}>Medium</Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleFilterChange('priority', 'high')}>High</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>

                                <Dropdown>
                                    <Dropdown.Toggle variant="outline-primary">
                                        Status: {filters.status === 'all' ? 'All' : filters.status}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={() => handleFilterChange('status', 'all')}>All</Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleFilterChange('status', 'pending')}>Pending</Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleFilterChange('status', 'completed')}>Completed</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>

                            <ListGroup>
                                {filteredTodos.map((todo, index) => (
                                    <ListGroup.Item 
                                        key={index} 
                                        className="d-flex justify-content-between align-items-start py-3 border-left border-3"
                                        style={{
                                            borderLeftColor: todo.priority === 'high' ? '#dc3545' : 
                                                            todo.priority === 'medium' ? '#ffc107' : '#17a2b8'
                                        }}
                                    >
                                        <div className="ms-2 me-auto" style={{ flexGrow: 1 }}>
                                            <div className="d-flex align-items-center">
                                                <Form.Check 
                                                    type="checkbox"
                                                    checked={todo.status === 'Completed'}
                                                    onChange={() => toggleTodo(index)}
                                                    className="me-2"
                                                />
                                                <h5 className={`mb-1 ${todo.status === 'Completed' ? 'text-muted text-decoration-line-through' : ''}`}>
                                                    {todo.name}
                                                </h5>
                                                <Badge 
                                                    bg={getPriorityBadgeVariant(todo.priority)}
                                                    className="ms-2"
                                                >
                                                    {todo.priority}
                                                </Badge>
                                                <Badge 
                                                    bg={todo.status === 'Completed' ? 'success' : 'secondary'}
                                                    className="ms-2"
                                                >
                                                    {todo.status}
                                                </Badge>
                                            </div>
                                            <p className="mb-1 text-muted">{todo.description}</p>
                                            <small className="text-muted">
                                                Due Date: {todo.dueDate || 'No due date'}
                                            </small>
                                        </div>
                                        <ButtonGroup>
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm" 
                                                onClick={() => handleShow(index)}
                                                className="me-2"
                                            >
                                                Edit
                                            </Button>
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm" 
                                                onClick={() => handleShowDeleteModal(index)}
                                            >
                                                Delete
                                            </Button>
                                        </ButtonGroup>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </>
                    )}




                    

                <Modal 
                        show={showBinModal} 
                        onHide={() => {
                            setShowBinModal(false);
                            setSelectedBinItems([]);
                        }}
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
                                    >
                                        <Form.Check
                                            type="checkbox"
                                            checked={selectedBinItems.includes(index)}
                                            onChange={() => handleBinItemSelect(index)}
                                            label={
                                                <div>
                                                    <h6 className="mb-1">{todo.name}</h6>
                                                    <small className="text-muted">
                                                        Deleted: {new Date(todo.deletedAt).toLocaleDateString()}
                                                    </small>
                                                </div>
                                            }
                                        />
                                        <div>
                                            <Badge 
                                                bg={getPriorityBadgeVariant(todo.priority)}
                                                className="me-2"
                                            >
                                                {todo.priority}
                                            </Badge>
                                            <Badge 
                                                bg={todo.status === 'completed' ? 'success' : 'secondary'}
                                            >
                                                {todo.status}
                                            </Badge>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button 
                                variant="success" 
                                disabled={selectedBinItems.length === 0}
                                onClick={() => setShowRestoreModal(true)}
                            >
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

                    {/* Restore Confirmation Modal */}
                    <Modal show={showRestoreModal} onHide={() => setShowRestoreModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Confirm Restore</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            Are you sure you want to restore {selectedBinItems.length} selected task(s)?
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowRestoreModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="success" onClick={handleRestoreConfirm}>
                                Restore
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Permanent Delete Confirmation Modal */}
                    <Modal 
                        show={showPermanentDeleteModal} 
                        onHide={() => setShowPermanentDeleteModal(false)}
                    >
                        <Modal.Header closeButton>
                            <Modal.Title>Confirm Permanent Deletion</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            Are you sure you want to permanently delete {selectedBinItems.length} selected task(s)? 
                            This action cannot be undone.
                        </Modal.Body>
                        <Modal.Footer>
                            <Button 
                                variant="secondary" 
                                onClick={() => setShowPermanentDeleteModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handlePermanentDeleteConfirm}>
                                Delete Permanently
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Task Modal Form */}
                    <Modal show={showModal} onHide={handleClose}>
                        <Modal.Header closeButton>
                            <Modal.Title>{editingIndex !== null ? 'Edit Task' : 'Add New Task'}</Modal.Title>
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
                                    <Form.Select
                                        name="status"
                                        value={newTodo.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Priority</Form.Label>
                                    <Form.Select
                                        name="priority"
                                        value={newTodo.priority}
                                        onChange={handleInputChange}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Due Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="dueDate"
                                        value={newTodo.dueDate}
                                        onChange={handleInputChange}
                                    />
                                </Form.Group>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleSubmit}>
                                {editingIndex !== null ? 'Save Changes' : 'Add Task'}
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Delete Confirmation Modal */}
                    <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
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
                </Col>
            </Row>
        </Container>
    );
}

export default TodoList;

