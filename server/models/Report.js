/**
 * models/Report.js – AI-Generated Report Model
 * Stores AI productivity analysis results per user.
 */

const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportType: {
      type: String,
      enum: ['weekly', 'sprint', 'monthly', 'custom'],
      default: 'weekly',
    },
    // ── AI Generated Content ────────────────────────────────────────────────
    summary: {
      type: String,
      required: true,
    },
    productivityScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    recommendations: [
      {
        type: { type: String, enum: ['task', 'bottleneck', 'improvement'] },
        title: String,
        description: String,
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      },
    ],
    // ── Bottleneck Detection ─────────────────────────────────────────────────
    bottlenecks: [String],
    inactiveContributors: [String],
    // ── Input Context ────────────────────────────────────────────────────────
    commitCount: Number,
    prCount: Number,
    issueCount: Number,
    dateRange: {
      from: Date,
      to: Date,
    },
    // ── Model Used ───────────────────────────────────────────────────────────
    aiModel: {
      type: String,
      default: 'gpt-4o-mini',
    },
    tokensUsed: Number,
  },
  { timestamps: true }
);

// Index for fast user + date queries
ReportSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Report', ReportSchema);
