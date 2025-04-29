import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  score: { type: Number, default: 0 }
});

export default mongoose.model('Player', playerSchema);
