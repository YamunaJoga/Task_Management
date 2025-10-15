import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navbar, Nav, Container, Button, Badge, Dropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const onLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getUserBadgeVariant = (role) => {
    return role === 'admin' ? 'warning' : 'secondary';
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="navbar-professional">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand className="fw-bold d-flex align-items-center">
            <i className="fas fa-tasks me-2"></i>
            Task Management
          </Navbar.Brand>
        </LinkContainer>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {user ? (
              <>
                <LinkContainer to="/tasks">
                  <Nav.Link className="fw-semibold">
                    <i className="fas fa-list-check me-1"></i>
                    Tasks
                  </Nav.Link>
                </LinkContainer>
                <LinkContainer to="/documents">
                  <Nav.Link className="fw-semibold">
                    <i className="fas fa-file-alt me-1"></i>
                    Documents
                  </Nav.Link>
                </LinkContainer>
                {user.role === 'admin' && (
                  <LinkContainer to="/admin">
                    <Nav.Link className="fw-semibold">
                      <i className="fas fa-crown me-1"></i>
                      Admin Approvals
                    </Nav.Link>
                  </LinkContainer>
                )}
              </>
            ) : (
              <>
                <LinkContainer to="/login">
                  <Nav.Link className="fw-semibold">Login</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/register">
                  <Nav.Link className="fw-semibold">Register</Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
          
          {user && (
            <Nav>
              <Dropdown align="end">
                <Dropdown.Toggle 
                  variant="outline-light" 
                  id="user-dropdown"
                  className="d-flex align-items-center"
                >
                  <i className="fas fa-user-circle me-2"></i>
                  {user.name}
                  <Badge bg={getUserBadgeVariant(user.role)} className="ms-2">
                    {user.role}
                  </Badge>
                </Dropdown.Toggle>
                
                <Dropdown.Menu>
                  <Dropdown.Header>
                    <div className="text-center">
                      <div className="fw-bold">{user.name}</div>
                      <small className="text-muted">{user.email}</small>
                    </div>
                  </Dropdown.Header>
                  <Dropdown.Item onClick={onLogout} className="text-danger">
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;