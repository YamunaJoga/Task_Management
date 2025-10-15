import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Badge, 
  Button, 
  Alert, 
  Modal,
  Form
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';

const Documents = () => {
  const { user } = useSelector((state) => state.auth);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    fileUrl: '',
    task: ''
  });
  const [approvalNotes, setApprovalNotes] = useState('');

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/documents', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setDocuments(response.data.data);
      }
    } catch (error) {
      setError('Failed to fetch documents');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's tasks for document upload
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/tasks', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
      fetchTasks();
    }
  }, [user]);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      default: return 'secondary';
    }
  };

  // Upload Document
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/documents', uploadForm, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setShowUploadModal(false);
        setUploadForm({ name: '', fileUrl: '', task: '' });
        fetchDocuments(); // Refresh the list
        alert('Document uploaded successfully!');
      }
    } catch (error) {
      alert('Failed to upload document: ' + (error.response?.data?.message || error.message));
    }
  };

  // Delete Document
  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/documents/${documentId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchDocuments(); // Refresh the list
        alert('Document deleted successfully!');
      } catch (error) {
        alert('Failed to delete document: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Approve/Reject Document (Admin Only)
  const handleApproveReject = async (status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/documents/${selectedDocument._id}/status`,
        {
          status,
          notes: approvalNotes
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setShowApproveModal(false);
        setSelectedDocument(null);
        setApprovalNotes('');
        fetchDocuments(); // Refresh the list
        alert(`Document ${status.toLowerCase()} successfully!`);
      }
    } catch (error) {
      alert('Failed to update document status: ' + (error.response?.data?.message || error.message));
    }
  };

  // Open approval modal
  const openApproveModal = (document) => {
    setSelectedDocument(document);
    setShowApproveModal(true);
  };

  if (!user) {
    return (
      <Container>
        <Alert variant="warning">Please login to view documents</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Task Documents</h2>
            {user.role === 'user' && (
              <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                Upload Task Document
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col>
          <Card>
            <Card.Body>
              {loading ? (
                <div className="text-center">Loading documents...</div>
              ) : documents.length === 0 ? (
                <div className="text-center text-muted">
                  <p>No Task documents found.</p>
                  {user.role === 'user' && (
                    <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                      Upload Your Task Document
                    </Button>
                  )}
                </div>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Task Document Name</th>
                      <th>Task Title</th>
                      {user.role === 'admin' && <th>Task Uploaded By</th>}
                      <th>Task Status</th>
                      <th>Task Upload Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc._id}>
                        <td>{doc.name}</td>
                        <td>{doc.task?.title || 'N/A'}</td>
                        {user.role === 'admin' && (
                          <td>
                            {doc.user?.name || 'Unknown'} 
                            {doc.user?.email && ` (${doc.user.email})`}
                          </td>
                        )}
                        <td>
                          <Badge bg={getStatusVariant(doc.status)}>
                            {doc.status}
                          </Badge>
                        </td>
                        <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => window.open(doc.fileUrl, '_blank')}
                          >
                            View
                          </Button>
                          
                          {/* Delete button - users can delete their own, admins can delete any */}
                          {(user.role === 'admin' || doc.user?._id === user.id) && (
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="me-2"
                              onClick={() => handleDeleteDocument(doc._id)}
                            >
                              Delete
                            </Button>
                          )}
                          
                          {/* Approve/Reject buttons - admin only */}
                          {user.role === 'admin' && doc.status === 'Pending' && (
                            <>
                              <Button 
                                variant="success" 
                                size="sm"
                                className="me-1"
                                onClick={() => openApproveModal(doc)}
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => openApproveModal(doc)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Upload Document Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Task Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUploadDocument}>
            <Form.Group className="mb-3">
              <Form.Label>Task Document Name *</Form.Label>
              <Form.Control
                type="text"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({...uploadForm, name: e.target.value})}
                placeholder="e.g., Project_Report.pdf"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Task File URL *</Form.Label>
              <Form.Control
                type="url"
                value={uploadForm.fileUrl}
                onChange={(e) => setUploadForm({...uploadForm, fileUrl: e.target.value})}
                placeholder="https://example.com/document.pdf"
                required
              />
              <Form.Text className="text-muted">
                Since we're simulating file upload, provide a URL to your document
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Select Task *</Form.Label>
              <Form.Select
                value={uploadForm.task}
                onChange={(e) => setUploadForm({...uploadForm, task: e.target.value})}
                required
              >
                <option value="">Choose a task...</option>
                {tasks.map(task => (
                  <option key={task._id} value={task._id}>
                    {task.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Upload Task Document
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Approve/Reject Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedDocument && `Review Document: ${selectedDocument.name}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDocument && (
            <>
              <p><strong>Task Document:</strong> {selectedDocument.name}</p>
              <p><strong>Task Title:</strong> {selectedDocument.task?.title}</p>
              <p><strong>Task Uploaded by:</strong> {selectedDocument.user?.name} ({selectedDocument.user?.email})</p>
              
              <Form.Group className="mb-3">
                <Form.Label>Approval Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add notes for approval/rejection..."
                />
              </Form.Group>

              <div className="d-flex gap-2">
                <Button 
                  variant="success" 
                  onClick={() => handleApproveReject('Approved')}
                >
                  Approve Document
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => handleApproveReject('Rejected')}
                >
                  Reject Document
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowApproveModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Documents;