/**
 * models/GithubData.js – Cached GitHub Data Model
 * Stores fetched GitHub data per user to reduce API rate limit usage.
 */

const mongoose = require('mongoose');

const CommitSchema = new mongoose.Schema({
  sha: String,
  message: String,
  author: String,
  date: Date,
  url: String,
  additions: { type: Number, default: 0 },
  deletions: { type: Number, default: 0 },
}, { _id: false });

const PullRequestSchema = new mongoose.Schema({
  id: Number,
  number: Number,
  title: String,
  state: { type: String, enum: ['open', 'closed', 'merged'] },
  author: String,
  createdAt: Date,
  updatedAt: Date,
  mergedAt: Date,
  url: String,
  reviewCount: { type: Number, default: 0 },
}, { _id: false });

const IssueSchema = new mongoose.Schema({
  id: Number,
  number: Number,
  title: String,
  state: { type: String, enum: ['open', 'closed'] },
  author: String,
  labels: [String],
  createdAt: Date,
  closedAt: Date,
  url: String,
}, { _id: false });

const RepoSchema = new mongoose.Schema({
  id: Number,
  name: String,
  fullName: String,
  description: String,
  language: String,
  stars: Number,
  forks: Number,
  openIssues: Number,
  isPrivate: Boolean,
  url: String,
  updatedAt: Date,
}, { _id: false });

const GithubDataSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    repositories: [RepoSchema],
    commits: [CommitSchema],
    pullRequests: [PullRequestSchema],
    issues: [IssueSchema],
    // ── Computed Stats ──────────────────────────────────────────────────────
    stats: {
      totalCommits: { type: Number, default: 0 },
      totalRepos: { type: Number, default: 0 },
      totalPRs: { type: Number, default: 0 },
      openPRs: { type: Number, default: 0 },
      closedPRs: { type: Number, default: 0 },
      totalIssues: { type: Number, default: 0 },
      openIssues: { type: Number, default: 0 },
      languages: [{ name: String, count: Number }],
    },
    lastFetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GithubData', GithubDataSchema);
