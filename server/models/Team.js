/**
 * models/Team.js – Team Model for Collaboration
 */

const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  }
}, { _id: false });

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a team name'],
      trim: true,
      maxlength: [60, 'Team name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      maxlength: [250, 'Description cannot exceed 250 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [TeamMemberSchema],
    githubRepos: {
      type: [String], // Array of repo full names e.g., 'owner/repo'
      default: [],
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', TeamSchema);
