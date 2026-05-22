/**
 * config/db.js – MongoDB Connection via Mongoose
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern Mongoose doesn't need useNewUrlParser etc, kept for clarity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Log when connection is lost
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1); // Fail fast if DB is unavailable
  }
};

module.exports = connectDB;
