import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  sender: {
    _id: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  message: {
    type: String,
    required: true,
  },
  isAi: {
    type: Boolean,
    default: false,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for chronological querying by project (accelerates chat history pagination)
messageSchema.index({ projectId: 1, createdAt: -1 });
messageSchema.index({ projectId: 1, createdAt: -1, _id: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
