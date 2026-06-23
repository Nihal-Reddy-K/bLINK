import mongoose from 'mongoose';
import { MemoryMessage } from './memoryDb.js';

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true
  },
  sender: {
    type: String, // Username or Display Name
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const MongooseMessage = mongoose.models.Message || mongoose.model('Message', messageSchema);

const Message = {
  find: async (query = {}) => {
    if (global.dbConnected) {
      return await MongooseMessage.find(query).sort({ timestamp: 1 });
    }
    return await MemoryMessage.find(query);
  },
  create: async (messageData) => {
    if (global.dbConnected) {
      return await MongooseMessage.create(messageData);
    }
    return await MemoryMessage.create(messageData);
  },
  raw: MongooseMessage
};

export default Message;
