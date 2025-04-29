import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import MapComponent from './components/MapComponent.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import UsernamePrompt from './components/UsernamePrompt.jsx';
import ClueDisplay from './components/ClueDisplay.jsx';

// Change this to your Render backend URL
const socket = io(
  import.meta.env.PROD
    ? 'https://guess-the-places.onrender.com'  // Replace this with your real backend URL
    : 'http://localhost:3001'
);

function App() {
  const [username, setUsername] = useState('');
  const [clue, setClue] = useState('');
  const [distance, setDistance] = useState(null);
  const [remaining, setRemaining] = useState(3);
  const [leaderboard, setLeaderboard] = useState([]);
  const [roundScore, setRoundScore] = useState(null);

  useEffect(() => {
    socket.on('clue', setClue);
    socket.on('guessResult', ({ distance, remaining }) => {
      setDistance(distance);
      setRemaining(remaining);
    });
    socket.on('roundEnd', ({ score }) => {
      setRoundScore(score);
    });
    socket.on('leaderboard', setLeaderboard);

    return () => {
      socket.off('clue');
      socket.off('guessResult');
      socket.off('roundEnd');
      socket.off('leaderboard');
    };
  }, []);

  const handleUsernameSubmit = (name) => {
    setUsername(name);
    socket.emit('join', name);
  };

  const handleMapClick = ({ lat, lng }) => {
    if (remaining > 0) {
      socket.emit('guess', { lat, lng });
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {!username && <UsernamePrompt onSubmit={handleUsernameSubmit} />}
      {username && (
        <>
          <ClueDisplay clue={clue} />
          <MapComponent onMapClick={handleMapClick} />
          <div>
            {distance !== null && (
              <p>Distance from target: {`${distance} km`}</p>
            )}
            <p>Guesses remaining: {remaining}</p>
            {roundScore !== null && (
              <p>Round Score: {roundScore}</p>
            )}
          </div>
          <Leaderboard data={leaderboard} />
        </>
      )}
    </div>
  );
}

export default App;
