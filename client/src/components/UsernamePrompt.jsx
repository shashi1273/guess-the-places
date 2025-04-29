import React, { useState } from 'react';

function UsernamePrompt({ onSubmit }) {
  const [name, setName] = useState('');
  return (
    <div>
      <h2>Enter your username</h2>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={() => onSubmit(name)}>Join Game</button>
    </div>
  );
}

export default UsernamePrompt;
