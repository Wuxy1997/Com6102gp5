import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';

// Generate random test user data
const generateTestUser = () => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  return {
    email: `test${timestamp}${randomNum}@test.com`,
    password: `test${timestamp}${randomNum}`,
    name: `TestUser${randomNum}`
  };
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    let userData;
    
    // Check if this is a test user registration
    if (req.body.isTestUser) {
      userData = generateTestUser();
      // Send the credentials back to the client
      const credentials = {
        email: userData.email,
        password: userData.password // 发送原始密码回客户端
      };
      res.setHeader('X-Test-Credentials', JSON.stringify(credentials));
    } else {
      userData = {
        email: req.body.email,
        password: req.body.password,
        name: req.body.name
      };
    }

    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = new User({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    // If it's a test user, include the credentials in the response
    if (req.body.isTestUser) {
      return res.status(201).json({
        token,
        testCredentials: {
          email: userData.email,
          password: userData.password
        }
      });
    }

    res.status(201).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}; 