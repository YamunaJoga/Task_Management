const request = require('supertest');
const app = require('../server');
const Task = require('../models/Task');
const User = require('../models/User');

describe('Task API', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Create test user and get token
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    token = res.body.token;
    userId = user._id;
  });

  afterAll(async () => {
    await User.deleteMany();
    await Task.deleteMany();
  });

  it('should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Task',
        description: 'Test Description',
        dueDate: '2024-12-31'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('title', 'Test Task');
  });
});