import mongoose from 'mongoose';
import { MemoryUser } from './memoryDb.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  token: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: 'avatar1'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseUser = mongoose.models.User || mongoose.model('User', userSchema);

const User = {
  findOne: async (query) => {
    if (global.dbConnected) {
      return await MongooseUser.findOne(query);
    }
    return await MemoryUser.findOne(query);
  },
  findById: async (id) => {
    if (global.dbConnected) {
      return await MongooseUser.findById(id);
    }
    return await MemoryUser.findById(id);
  },
  create: async (userData) => {
    if (global.dbConnected) {
      return await MongooseUser.create(userData);
    }
    return await MemoryUser.create(userData);
  },
  findByIdAndUpdate: async (id, updateData, options = {}) => {
    if (global.dbConnected) {
      return await MongooseUser.findByIdAndUpdate(id, updateData, { new: true, ...options });
    }
    return await MemoryUser.findByIdAndUpdate(id, updateData, options);
  },
  // Expose the raw model if needed
  raw: MongooseUser
};

export default User;
