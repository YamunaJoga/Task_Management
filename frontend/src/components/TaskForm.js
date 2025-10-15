import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';

const TaskForm = ({ onSubmit, initialData, isEdit = false, users = [], isAdmin = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To Do',
    dueDate: '',
    assignedUser: '',
    latitude: '',
    longitude: ''
  });

  const [showLocation, setShowLocation] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        status: initialData.status || 'To Do',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        assignedUser: initialData.user?._id || initialData.user || '',
        latitude: initialData.location?.coordinates?.[1] || '',
        longitude: initialData.location?.coordinates?.[0] || ''
      });
      setShowLocation(!!initialData.location);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.dueDate) {
      setMessage('Please fill in all required fields');
      return;
    }

    const submitData = { ...formData };
    
    // For admin creating/editing tasks, use assigned user
    if (isAdmin && submitData.assignedUser) {
      submitData.user = submitData.assignedUser;
    }
    
    // Clean up the data
    delete submitData.assignedUser;
    
    if (!showLocation) {
      delete submitData.latitude;
      delete submitData.longitude;
    } else if (submitData.latitude && submitData.longitude) {
      submitData.location = {
        type: 'Point',
        coordinates: [parseFloat(submitData.longitude), parseFloat(submitData.latitude)]
      };
      delete submitData.latitude;
      delete submitData.longitude;
    }

    onSubmit(submitData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {message && <Alert variant="danger">{message}</Alert>}
      
      <Form.Group className="mb-3">
        <Form.Label>Task Title *</Form.Label>
        <Form.Control
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter task title"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Task Description *</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the task details..."
          required
        />
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Task Status</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Task Due Date *</Form.Label>
            <Form.Control
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      {/* User Assignment (Admin only) */}
      {isAdmin && (
        <Form.Group className="mb-3">
          <Form.Label>Assign Task to User</Form.Label>
          <Form.Select
            name="assignedUser"
            value={formData.assignedUser}
            onChange={handleChange}
          >
            <option value="">Select a user...</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email}) - {user.role}
              </option>
            ))}
            {users.length === 0 && (
              <option disabled>No users available</option>
            )}
          </Form.Select>
          <Form.Text className="text-muted">
            Leave unassigned to assign to yourself
          </Form.Text>
        </Form.Group>
      )}

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Add Location (Optional)"
          checked={showLocation}
          onChange={(e) => setShowLocation(e.target.checked)}
        />
      </Form.Group>

      {showLocation && (
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Latitude</Form.Label>
              <Form.Control
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="e.g., 40.7128"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Longitude</Form.Label>
              <Form.Control
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="e.g., -74.0060"
              />
            </Form.Group>
          </Col>
        </Row>
      )}

      <div className="d-flex gap-2">
        <Button variant="primary" type="submit">
          {isEdit ? 'Update Task' : 'Create Task'}
        </Button>
        <Button variant="secondary" type="button" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </Form>
  );
};

export default TaskForm;