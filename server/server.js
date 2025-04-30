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

// ✅ Enable CORS for your deployed client
app.use(cors({
  origin: 'https://guess-the-places-client.onrender.com',  // ✅ Frontend URL
  methods: ['GET', 'POST'],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: 'https://guess-the-places-client.onrender.com',  // ✅ Frontend URL
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));



let currentLocation = null;
let players = {};

// ✅ Distance formula
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ✅ Start new round

async function newRound() {
  try {
    const db = mongoose.connection.useDb('test'); // 👈 use the "test" database
    const result = await db.collection('cities').aggregate([{ $sample: { size: 1 } }]).toArray();
    
    if (result.length === 0) {
      console.error('No cities found in the database.');
      return;
    }

    const randomCity = result[0];
    currentLocation = {
      clue: randomCity.clue,
      lat: randomCity.lat,
      lng: randomCity.long
    };

    io.emit('clue', currentLocation.clue);
  } catch (err) {
    console.error('Failed to fetch random city from MongoDB:', err);
  }
}




// ✅ Handle socket events
io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

 socket.on('join', async (username) => {
  players[socket.id] = { username, guesses: 0, bestDistance: null };
  let existing = await Player.findOne({ username });
  if (!existing) {
    await Player.create({ username });
  }
  socket.emit('joined', username);

  if (!currentLocation) {
   await newRound();  // only if no current location exists
  }

  socket.emit('clue', currentLocation.clue);  // ✅ send the clue

  // ✅ NEW: Send leaderboard immediately upon joining
  const topPlayers = await Player.find().sort({ score: -1 }).limit(10);
  socket.emit('leaderboard', topPlayers);  // ✅ send leaderboard only to this player
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

      // Start a new round after everyone's done
      if (Object.values(players).every(p => p.guesses >= 3)) {
        newRound();
        // Reset guesses
        for (const id in players) {
          players[id].guesses = 0;
          players[id].bestDistance = null;
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
  });
});

// ✅ Server listen
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
