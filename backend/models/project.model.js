import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    lowercase: true,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  fileTree: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  // Priority 4.3: Enable timestamps for auditing, sorting by last modified, and activity tracking
  timestamps: true
});

// Priority 4.1: Compound unique index prevents a single user from creating duplicate projects
// with identical names, while allowing different users to share project names globally.
projectSchema.index({ name: 1, owner: 1 }, { unique: true });

// Priority 2.2: Multikey index on `users` to accelerate collaborator and dashboard queries (avoid COLLSCAN)
projectSchema.index({ users: 1 });
projectSchema.index({ users: 1, updatedAt: -1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
