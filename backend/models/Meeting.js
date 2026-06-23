import mongoose from 'mongoose';
import { MemoryMeeting } from './memoryDb.js';

const meetingSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: 'Untitled Meeting'
  },
  creator: {
    type: String, // Username or User ID
    required: true
  },
  participants: {
    type: [String], // Array of usernames
    default: []
  },
  duration: {
    type: Number, // In minutes or seconds
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseMeeting = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);

const Meeting = {
  findOne: async (query) => {
    if (global.dbConnected) {
      return await MongooseMeeting.findOne(query);
    }
    return await MemoryMeeting.findOne(query);
  },
  find: async (query = {}) => {
    if (global.dbConnected) {
      return await MongooseMeeting.find(query).sort({ createdAt: -1 });
    }
    return await MemoryMeeting.find(query);
  },
  create: async (meetingData) => {
    if (global.dbConnected) {
      return await MongooseMeeting.create(meetingData);
    }
    return await MemoryMeeting.create(meetingData);
  },
  deleteOne: async (query) => {
    if (global.dbConnected) {
      return await MongooseMeeting.deleteOne(query);
    }
    return await MemoryMeeting.deleteOne(query);
  },
  raw: MongooseMeeting
};

export default Meeting;
