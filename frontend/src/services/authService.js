import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// Register user
const register = async (userData) => {
  try {
    console.log('Sending registration request to:', API_URL + '/register');
    const response = await axios.post(API_URL + '/register', userData);
    console.log('Registration response:', response.data);

    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);
      console.log('User data stored in localStorage');
    }

    return response.data;
  } catch (error) {
    console.error('Registration service error:', error);
    throw error;
  }
};

// Login user
const login = async (userData) => {
  try {
    const response = await axios.post(API_URL + '/login', userData);

    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);
    }

    return response.data;
  } catch (error) {
    console.error('Login service error:', error);
    throw error;
  }
};

// Logout user
const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

const authService = {
  register,
  login,
  logout
};

export default authService;