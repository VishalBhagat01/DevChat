import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    lowercase: true,
    required: true,
    trim: true,
    unique: true
  },
  users : [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
  ],
  fileTree: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

// Priority 2.2: Multikey index on `users` to accelerate collaborator and dashboard queries (avoid COLLSCAN)
projectSchema.index({ users: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
