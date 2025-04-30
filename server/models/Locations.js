import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  clue: String,
  lat: Number,
  lng: Number
});

const Location = mongoose.model('Location', locationSchema);
export default Location;
