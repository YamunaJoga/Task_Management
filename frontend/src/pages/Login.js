import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, reset } from '../redux/slices/authSlice';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { email, password } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      // Error handled in UI
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

    const userData = {
      email,
      password
    };

    dispatch(login(userData));
  };

  return (
    <div className="gradient-header">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="professional-card">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <i className="fas fa-tasks fa-2x text-primary mb-3"></i>
                  <h3 className="fw-bold text-dark">Welcome Back</h3>
                  <p className="text-muted">Sign in to your account</p>
                </div>
                
                {isError && (
                  <Alert variant="danger" className="border-0 rounded-3">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {message}
                  </Alert>
                )}
                
                <Form onSubmit={onSubmit}>
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

                  <Form.Group className="mb-4">
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
                        placeholder="Enter your password"
                        required
                        className="border-start-0"
                      />
                    </div>
                  </Form.Group>

                  <Button
                    type="submit"
                    className="primary-btn w-100 py-2 fw-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In
                      </>
                    )}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary fw-semibold text-decoration-none">
                      Create Account
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

export default Login;