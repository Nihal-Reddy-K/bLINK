import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Meeting from '../models/Meeting.js';

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'blink_secret_key_2026_premium_webrtc', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, username, password, avatar } = req.body;

  try {
    if (!name || !username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, username, and password' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      username,
      password: hashedPassword,
      avatar: avatar || 'avatar1',
    });

    const token = generateToken(user._id);
    
    // Save token to user record
    await User.findByIdAndUpdate(user._id, { token });

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      token,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    
    // Update token in user record
    await User.findByIdAndUpdate(user._id, { token });

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      token,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get user profile & statistics
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = req.user;

    // Fetch user meetings statistics
    // Find all meetings where the user is either the creator or a participant
    const meetings = await Meeting.find({
      $or: [
        { creator: user.username },
        { participants: user.username }
      ]
    });

    const totalMeetings = meetings.length;
    
    // Sum duration (duration is stored in minutes, convert or keep as is)
    const totalDurationSeconds = meetings.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const totalHours = parseFloat((totalDurationSeconds / 3600).toFixed(2)); // convert seconds to hours

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      stats: {
        totalMeetings,
        totalHours,
        totalMinutes: parseFloat((totalDurationSeconds / 60).toFixed(1))
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

// @desc    Update user profile settings
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const { name, avatar } = req.body;

  try {
    const updates = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    );

    res.json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};
