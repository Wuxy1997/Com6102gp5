import mongoose from 'mongoose';

const inputHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  calories: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
  },
  type: {
    type: String,
    enum: ['nutrition', 'workout', 'health'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 创建复合索引，确保同一用户、同一类型、同一名称的记录唯一
inputHistorySchema.index({ userId: 1, type: 1, name: 1 }, { unique: true });

export default mongoose.models.InputHistory || mongoose.model('InputHistory', inputHistorySchema); 