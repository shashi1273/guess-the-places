function Leaderboard({ data }) {
  return (
    <div>
      <h3>Leaderboard</h3>
      <ul>
        {data.map((player, i) => (
          <li key={i}>{player.username}: {player.score}</li>
        ))}
      </ul>
    </div>
  );
}
export default Leaderboard;
