import axios from 'axios';

const API_URL = 'http://localhost:5000/api/tasks';

const createAuthInstance = () => {
  const token = localStorage.getItem('token');
  
  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// Get tasks
const getTasks = async () => {
  const instance = createAuthInstance();
  const response = await instance.get('/');
  return response.data;
};

// Create task
const createTask = async (taskData) => {
  const instance = createAuthInstance();
  const response = await instance.post('/', taskData);
  return response.data;
};

// Update task
const updateTask = async (taskId, taskData) => {
  const instance = createAuthInstance();
  const response = await instance.put(`/${taskId}`, taskData);
  return response.data;
};

// Delete task
const deleteTask = async (taskId) => {
  const instance = createAuthInstance();
  const response = await instance.delete(`/${taskId}`);
  return response.data;
};

const taskService = {
  getTasks,
  createTask,
  updateTask,
  deleteTask
};

export default taskService;