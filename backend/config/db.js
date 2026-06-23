import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blink');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.dbConnected = true;
  } catch (error) {
    console.warn('---------------------------------------------------------');
    console.warn(`Database Connection Warning: ${error.message}`);
    console.warn('The server will fall back to local in-memory storage mode.');
    console.warn('No active MongoDB connection, but app will remain functional.');
    console.warn('---------------------------------------------------------');
    global.dbConnected = false;
  }
};

export default connectDB;
