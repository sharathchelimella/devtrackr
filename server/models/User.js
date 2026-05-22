/**
 * models/User.js – User Mongoose Model
 * Handles authentication data and GitHub token storage.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ['developer', 'admin', 'viewer'],
      default: 'developer',
    },
    // ── GitHub Integration ─────────────────────────────────────────────────
    github: {
      accessToken: {
        type: String,
        select: false, // Never expose token in API responses
      },
      username: String,
      avatarUrl: String,
      profileUrl: String,
      connectedAt: Date,
      isConnected: {
        type: Boolean,
        default: false,
      },
    },
    // ── Preferences ────────────────────────────────────────────────────────
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'dark',
      },
      defaultRepo: String,
    },
    // ── Timestamps ─────────────────────────────────────────────────────────
    lastLoginAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ── Pre-save Hook: Hash password before storing ───────────────────────────────
UserSchema.pre('save', async function (next) {
  // Only hash if password field was actually modified
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12); // Cost factor of 12 for security
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance Method: Compare plaintext vs hashed password ────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Sanitize output: remove sensitive fields from JSON ───────────────────────
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  if (obj.github) delete obj.github.accessToken;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
