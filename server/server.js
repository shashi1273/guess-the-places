import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Player from './models/Player.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors({
  origin: '*',  
  methods: ['GET', 'POST']
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

const locations = [
  { clue: "City with Eiffel Tower", lat: 48.8584, lng: 2.2945 },
  { clue: "Home of the Statue of Liberty", lat: 40.6892, lng: -74.0445 },
  { clue: "Great Wall country", lat: 40.4319, lng: 116.5704 }
];

let currentLocation = null;
let players = {};

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function newRound() {
  currentLocation = locations[Math.floor(Math.random() * locations.length)];
  io.emit('clue', currentLocation.clue);
}

io.on('connection', socket => {
  console.log('Player connected:', socket.id);

  socket.on('join', async username => {
    players[socket.id] = { username, guesses: 0, bestDistance: null };
    let existing = await Player.findOne({ username });
    if (!existing) {
      await Player.create({ username });
    }
    socket.emit('joined', username);
   if (!currentLocation) {
    newRound();  
  }
  socket.emit('clue', currentLocation.clue);  
});

  socket.on('guess', async ({ lat, lng }) => {
    const player = players[socket.id];
    if (!player || player.guesses >= 3) return;
    player.guesses += 1;

    const distance = haversine(lat, lng, currentLocation.lat, currentLocation.lng);
    if (!player.bestDistance || distance < player.bestDistance) {
      player.bestDistance = distance;
    }

    socket.emit('guessResult', {
      distance: Math.round(distance),
      remaining: 3 - player.guesses
    });

    if (player.guesses === 3) {
      const score = Math.max(0, 5000 - Math.round(player.bestDistance * 10));
      await Player.findOneAndUpdate(
        { username: player.username },
        { $inc: { score } }
      );
      socket.emit('roundEnd', { score });
      const top = await Player.find().sort({ score: -1 }).limit(10);
      io.emit('leaderboard', top);
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port ${process.env.PORT || 3001}`);
});

