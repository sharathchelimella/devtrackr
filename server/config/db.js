/**
 * config/db.js – MongoDB Atlas Connection via Mongoose
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,  // Fail fast if Atlas is unreachable
      socketTimeoutMS: 45000,          // Keep connection alive longer
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected – retrying...');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB error: ${err.message}`);
    });

  } catch (error) {
    console.error(`\n❌ MongoDB Atlas connection FAILED`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Check your MONGO_URI in .env file\n`);
    process.exit(1);
  }
};

module.exports = connectDB;

