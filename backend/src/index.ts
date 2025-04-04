import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/authRoutes';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://47.239.24.10:3000',
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://wubowen97:970412qw@ht.qyiekim.mongodb.net/?retryWrites=true&w=majority&appName=ht')
  .then(async () => {
    console.log('Connected to MongoDB');
    // Drop the users collection if it exists
    try {
      await mongoose.connection.db.dropCollection('users');
      console.log('Dropped users collection');
    } catch (err) {
      console.log('No users collection to drop');
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 