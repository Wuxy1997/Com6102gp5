import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { login, register } from './controllers/authController';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://wubowen97:970412qw@ht.qyiekim.mongodb.net/?retryWrites=true&w=majority&appName=ht')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.post('/api/auth/login', login);
app.post('/api/auth/register', register);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 