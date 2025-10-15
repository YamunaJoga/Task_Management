import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert, Form, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import axios from 'axios';

const Admin = () => {
  const { user } = useSelector((state) => state.auth);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Fetch pending documents
  const fetchPendingDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/documents', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Filter only pending documents
        const pending = response.data.data.filter(doc => doc.status === 'Pending');
        setPendingDocuments(pending);
      }
    } catch (error) {
      setError('Failed to fetch pending documents');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPendingDocuments();
    }
  }, [user]);

  // Approve/Reject Document
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
        fetchPendingDocuments(); // Refresh the list
        alert(`Document ${status.toLowerCase()} successfully!`);
      }
    } catch (error) {
      alert('Failed to update document status: ' + (error.response?.data?.message || error.message));
    }
  };

  const openApproveModal = (document) => {
    setSelectedDocument(document);
    setShowApproveModal(true);
  };

  if (!user || user.role !== 'admin') {
    return (
      <Container>
        <Alert variant="danger">Access denied. Admin privileges required.</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="my-4">
        <Col>
          <h2>Admin Dashboard - Pending Approvals</h2>
          <p className="text-muted">Review and approve/reject pending documents</p>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                Pending Task Document Approvals 
                {pendingDocuments.length > 0 && (
                  <Badge bg="warning" className="ms-2">
                    {pendingDocuments.length} pending
                  </Badge>
                )}
              </h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center">Loading pending task documents...</div>
              ) : pendingDocuments.length === 0 ? (
                <div className="text-center text-muted">
                  <p>No pending task documents for approval.</p>
                  <p>All task documents have been reviewed.</p>
                </div>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Task Document Name</th>
                      <th>Task Uploaded By</th>
                      <th>Task Title</th>
                      <th>Task Upload Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDocuments.map((doc) => (
                      <tr key={doc._id}>
                        <td>
                          <strong>{doc.name}</strong>
                        </td>
                        <td>
                          {doc.user?.name || 'Unknown'} 
                          <br />
                          <small className="text-muted">{doc.user?.email}</small>
                        </td>
                        <td>{doc.task?.title || 'N/A'}</td>
                        <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            className="me-2"
                            onClick={() => window.open(doc.fileUrl, '_blank')}
                          >
                            View File
                          </Button>
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

      {/* Approve/Reject Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Review Document: {selectedDocument?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDocument && (
            <>
              <div className="mb-3">
                <p><strong>Document:</strong> {selectedDocument.name}</p>
                <p><strong>Task:</strong> {selectedDocument.task?.title}</p>
                <p><strong>Uploaded by:</strong> {selectedDocument.user?.name} ({selectedDocument.user?.email})</p>
                <p><strong>Upload Date:</strong> {new Date(selectedDocument.createdAt).toLocaleDateString()}</p>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => window.open(selectedDocument.fileUrl, '_blank')}
                >
                  Open Document URL
                </Button>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Approval Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add notes for approval/rejection decision..."
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

export default Admin;