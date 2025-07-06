
import React from 'react';
import { GameProvider } from '../context/GameContext';
import { GameTable } from '../components/game/GameTable';

const Game: React.FC = () => {
  return (
    <GameProvider>
      <GameTable />
    </GameProvider>
  );
};

export default Game;