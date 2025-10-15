import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, reset } from '../redux/slices/authSlice';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    role: 'user'
  });

  const { name, email, password, password2, role } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      // Handle error
    }

    if (isSuccess || user) {
      navigate('/tasks');
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (password !== password2) {
      alert('Passwords do not match');
      return;
    }

    const userData = {
      name,
      email,
      password,
      role
    };

    dispatch(register(userData));
  };

  return (
    <div className="gradient-header">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="professional-card">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <i className="fas fa-user-plus fa-2x text-primary mb-3"></i>
                  <h3 className="fw-bold text-dark">Create Account</h3>
                  <p className="text-muted">Join TaskManagemnet today</p>
                </div>
                
                {isError && (
                  <Alert variant="danger" className="border-0 rounded-3">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {message}
                  </Alert>
                )}
                
                <Form onSubmit={onSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Full Name</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="fas fa-user text-muted"></i>
                          </span>
                          <Form.Control
                            type="text"
                            name="name"
                            value={name}
                            onChange={onChange}
                            placeholder="Enter your full name"
                            required
                            className="border-start-0"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Email Address</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="fas fa-envelope text-muted"></i>
                          </span>
                          <Form.Control
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            placeholder="Enter your email"
                            required
                            className="border-start-0"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Password</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="fas fa-lock text-muted"></i>
                          </span>
                          <Form.Control
                            type="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            placeholder="Create password"
                            required
                            minLength="6"
                            className="border-start-0"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Confirm Password</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0">
                            <i className="fas fa-lock text-muted"></i>
                          </span>
                          <Form.Control
                            type="password"
                            name="password2"
                            value={password2}
                            onChange={onChange}
                            placeholder="Confirm password"
                            required
                            minLength="6"
                            className="border-start-0"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Account Type</Form.Label>
                    <Form.Select 
                      name="role" 
                      value={role} 
                      onChange={onChange}
                      className="py-2"
                    >
                      <option value="user">👤 User Account</option>
                      <option value="admin">👑 Admin Account</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      {role === 'admin' 
                        ? 'Admin accounts have full system access' 
                        : 'User accounts can manage assigned tasks and documents'
                      }
                    </Form.Text>
                  </Form.Group>

                  <Button
                    type="submit"
                    className="primary-btn w-100 py-2 fw-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus me-2"></i>
                        Create Account
                      </>
                    )}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary fw-semibold text-decoration-none">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;