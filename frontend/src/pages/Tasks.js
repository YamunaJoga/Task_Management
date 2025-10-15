import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Badge, 
  Modal, 
  Alert,
  Dropdown
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { getTasks, createTask, updateTask, deleteTask } from '../redux/slices/taskSlice';
import TaskForm from '../components/TaskForm';
import axios from 'axios';

const Tasks = () => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const { user } = useSelector((state) => state.auth);
  const { tasks, isLoading, isError, message } = useSelector((state) => state.tasks);
  const dispatch = useDispatch();

  useEffect(() => {
    // Only fetch tasks if user exists and is authenticated
    if (user && user.id) {
      dispatch(getTasks());
      
      // Load users for admin assignment (admin only)
      if (user.role === 'admin') {
        fetchUsers();
      }
    }
  }, [user, dispatch]);

  // Fetch all users for admin assignment
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found');
        setUsers([]);
        return;
      }

      // Try to fetch users from the backend
      try {
        const response = await axios.get('http://localhost:5000/api/auth/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setUsers(response.data.data || []);
        }
      } catch (error) {
        console.log('Users endpoint not available yet, using empty list');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setShowEditModal(false);
    setSelectedTask(null);
  };

  const handleShowCreate = () => setShowModal(true);
  
  const handleShowEdit = (task) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleTaskSubmit = (taskData) => {
    dispatch(createTask(taskData));
    handleClose();
  };

  const handleTaskUpdate = (taskData) => {
    if (selectedTask) {
      dispatch(updateTask({ id: selectedTask._id, taskData }));
      handleClose();
    }
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(taskId));
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        return;
      }

      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh tasks list
      dispatch(getTasks());
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    }
  };

  const handleAssignTask = async (taskId, assignedUserId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        return;
      }

      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        { user: assignedUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh tasks list
      dispatch(getTasks());
      alert('Task assigned successfully!');
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Failed to assign task');
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'To Do': return 'secondary';
      case 'In Progress': return 'warning';
      case 'Done': return 'success';
      default: return 'secondary';
    }
  };

  // Calculate due date status and styling
  const getDueDateStatus = (dueDate, status) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    // Reset time part for accurate day comparison
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const timeDiff = due.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // If task is done, show in normal color
    if (status === 'Done') {
      return {
        className: '',
        badge: null,
        text: 'Completed'
      };
    }
    
    // Overdue (past due date)
    if (daysDiff < 0) {
      return {
        className: 'text-danger fw-bold',
        badge: 'danger',
        text: 'Overdue'
      };
    }
    
    // Due within 3 days (including today: 0, 1, 2 days from now)
    if (daysDiff <= 2) {
      let dueText = '';
      if (daysDiff === 0) {
        dueText = 'Due Today';
      } else if (daysDiff === 1) {
        dueText = 'Due Tomorrow';
      } else {
        dueText = `Due in ${daysDiff} days`;
      }
      
      return {
        className: 'text-warning fw-bold',
        badge: 'warning',
        text: dueText
      };
    }
    
    // More than 3 days remaining
    return {
      className: '',
      badge: null,
      text: null
    };
  };

  // Filter tasks based on user role with null checks
  const getFilteredTasks = () => {
    // If user is null or not authenticated, return empty array
    if (!user || !user.id) {
      return [];
    }

    if (user.role === 'admin') {
      return tasks || []; // Admin sees all tasks
    } else {
      // Users see only tasks assigned to them
      return (tasks || []).filter(task => {
        if (!task) return false;
        
        // Check if task.user is an object with _id or a string ID
        const taskUserId = task.user?._id || task.user;
        return taskUserId === user.id;
      });
    }
  };

  const filteredTasks = getFilteredTasks();

  // Show loading or login prompt if user is not authenticated
  if (!user) {
    return (
      <Container>
        <Alert variant="warning" className="text-center">
          <h4>Please Login</h4>
          <p>You need to be logged in to view tasks.</p>
          <Button 
            variant="primary" 
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </Button>
        </Alert>
      </Container>
    );
  }

  // Show loading state while checking authentication
  if (!user.id) {
    return (
      <Container>
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading user information...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>
                {user.role === 'admin' ? 'All Assigned Tasks' : 'My Tasks'}
                <Badge bg="light" text="dark" className="ms-2">
                  {filteredTasks.length} tasks
                </Badge>
              </h2>
              <p className="text-muted mb-0">
                {user.role === 'admin' 
                  ? 'Manage all Assigned tasks and assignments' 
                  : 'View your Assigned tasks and update status'
                }
              </p>
              
              {/* Due Date Legend */}
              <div className="mt-2">
                <small className="text-muted">
                  <span className="text-danger">●</span> Overdue 
                  <span className="text-warning"> ●</span> Due within 3 days 
                  <span className="text-success"> ●</span> Completed
                </small>
              </div>
            </div>
            
            {/* Show Create button for Admin, hide for regular users */}
            {user.role === 'admin' && (
              <Button variant="primary" onClick={handleShowCreate}>
                Create Task
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {isError && <Alert variant="danger">{message}</Alert>}

      <Row>
        <Col>
          <Card>
            <Card.Body>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <p className="fs-5">
                    {user.role === 'admin' 
                      ? 'No tasks found. Create the first task!' 
                      : 'No tasks assigned to you yet.'
                    }
                  </p>
                  {user.role === 'admin' && (
                    <Button variant="primary" onClick={handleShowCreate}>
                      Create Your First Task
                    </Button>
                  )}
                </div>
              ) : (
                <Table responsive hover>
                  <thead className="table-dark">
                    <tr>
                      <th>Task Title</th>
                      <th>Task Description</th>
                      {user.role === 'admin' && <th>Task Assigned To</th>}
                      <th>Task Status</th>
                      <th>Task Due Date</th>
                      {/* Show Actions column only for Admin */}
                      {user.role === 'admin' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => {
                      const dueDateStatus = getDueDateStatus(task.dueDate, task.status);
                      
                      return (
                        <tr key={task._id}>
                          <td>
                            <strong>{task.title}</strong>
                          </td>
                          <td>
                            <div style={{ maxWidth: '200px' }}>
                              {task.description}
                            </div>
                          </td>
                          
                          {/* Assigned User Column (Admin only) */}
                          {user.role === 'admin' && (
                            <td>
                              {task.user ? (
                                <Dropdown>
                                  <Dropdown.Toggle 
                                    variant="outline-secondary" 
                                    size="sm"
                                    id={`assign-dropdown-${task._id}`}
                                  >
                                    {typeof task.user === 'object' ? task.user.name : 'Unassigned'}
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu>
                                    <Dropdown.Header>Assign to user:</Dropdown.Header>
                                    {users.map((userItem) => (
                                      <Dropdown.Item 
                                        key={userItem._id}
                                        onClick={() => handleAssignTask(task._id, userItem._id)}
                                      >
                                        {userItem.name} ({userItem.email})
                                      </Dropdown.Item>
                                    ))}
                                    {users.length === 0 && (
                                      <Dropdown.Item disabled>
                                        {loadingUsers ? 'Loading users...' : 'No users available'}
                                      </Dropdown.Item>
                                    )}
                                  </Dropdown.Menu>
                                </Dropdown>
                              ) : (
                                <Badge bg="secondary">Unassigned</Badge>
                              )}
                            </td>
                          )}
                          
                          {/* Status Column - Available for both Admin and Users */}
                          <td>
                            <Dropdown>
                              <Dropdown.Toggle 
                                variant={getStatusVariant(task.status)} 
                                size="sm"
                                id={`status-dropdown-${task._id}`}
                              >
                                {task.status}
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Header>Update Status:</Dropdown.Header>
                                <Dropdown.Item onClick={() => handleStatusUpdate(task._id, 'To Do')}>
                                  <Badge bg="secondary">To Do</Badge>
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusUpdate(task._id, 'In Progress')}>
                                  <Badge bg="warning">In Progress</Badge>
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => handleStatusUpdate(task._id, 'Done')}>
                                  <Badge bg="success">Done</Badge>
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                          
                          {/* Due Date Column with Enhanced Styling */}
                          <td>
                            <div className={dueDateStatus.className}>
                              <div>
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                              {dueDateStatus.badge && (
                                <Badge bg={dueDateStatus.badge} className="mt-1">
                                  {dueDateStatus.text}
                                </Badge>
                              )}
                              {task.status === 'Done' && (
                                <Badge bg="success" className="mt-1">
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </td>
                          
                          {/* Actions Column - Only for Admin */}
                          {user.role === 'admin' && (
                            <td>
                              <div className="d-flex gap-1">
                                {/* Edit button - Admin can edit any task */}
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => handleShowEdit(task)}
                                >
                                  Edit
                                </Button>
                                
                                {/* Delete button - Admin can delete any task */}
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDeleteTask(task._id)}
                                >
                                  Delete
                                </Button>
                                
                                {/* View Documents button */}
                                <Button 
                                  variant="outline-info" 
                                  size="sm"
                                  onClick={() => window.location.href = `/documents?task=${task._id}`}
                                >
                                  Documents
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Task Modal (Admin only) */}
      {user.role === 'admin' && (
        <Modal show={showModal} onHide={handleClose} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Create New Task</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <TaskForm 
              onSubmit={handleTaskSubmit} 
              users={users}
              isAdmin={user.role === 'admin'}
            />
          </Modal.Body>
        </Modal>
      )}

      {/* Edit Task Modal (Admin only) */}
      {user.role === 'admin' && (
        <Modal show={showEditModal} onHide={handleClose} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Edit Task</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <TaskForm 
              onSubmit={handleTaskUpdate}
              initialData={selectedTask}
              isEdit={true}
              users={users}
              isAdmin={user.role === 'admin'}
            />
          </Modal.Body>
        </Modal>
      )}
    </Container>
  );
};

export default Tasks;