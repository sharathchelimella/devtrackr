/**
 * models/User.js – User Mongoose Model
 * Supports both email/password auth AND GitHub OAuth login.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Please provide a name'],
      trim:      true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Please provide an email'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type:      String,
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false, // Never return password in queries
      // NOT required – OAuth users have no password
    },
    role: {
      type:    String,
      enum:    ['developer', 'admin', 'viewer'],
      default: 'developer',
    },

    // ── Auth method ────────────────────────────────────────────────────────
    authProvider: {
      type:    String,
      enum:    ['local', 'github'],
      default: 'local',
    },

    // ── GitHub OAuth + Integration ─────────────────────────────────────────
    github: {
      // GitHub OAuth user ID (used to match returning OAuth users)
      githubId: { type: String, index: true },

      // OAuth access token (also used for GitHub REST API calls)
      accessToken: { type: String, select: false },

      username:   String,
      avatarUrl:  String,
      profileUrl: String,
      bio:        String,
      location:   String,
      publicRepos: Number,
      followers:   Number,

      connectedAt: Date,
      lastSyncAt:  Date,

      isConnected: { type: Boolean, default: false },
    },

    // ── Preferences ────────────────────────────────────────────────────────
    preferences: {
      theme:       { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
      defaultRepo: String,
      autoSync:    { type: Boolean, default: true },
    },

    lastLoginAt: Date,
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Index for fast OAuth lookups ──────────────────────────────────────────────
UserSchema.index({ 'github.githubId': 1 });

// ── Pre-save: hash password only for local auth users ────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt   = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance Method: compare plaintext vs hashed ─────────────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // OAuth user has no password
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Sanitize: strip sensitive fields from JSON output ────────────────────────
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  if (obj.github) delete obj.github.accessToken;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
