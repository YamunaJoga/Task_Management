import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { Provider } from 'react-redux';
import { store } from './redux/store';

import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import Admin from './pages/Admin';

import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Tasks />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;