
import React from 'react';
import { Suit, SuitSymbol } from '../../types/game';

interface TrumpSelectorProps {
  onSelectTrump: (suit: Suit) => void;
}

export const TrumpSelector: React.FC<TrumpSelectorProps> = ({ onSelectTrump }) => {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 p-6 rounded-lg shadow-lg border-2 border-red-800 z-50 w-80">
      <h3 className="text-center text-xl font-bold mb-4 text-red-900">Select Trump Suit (رنگ)</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelectTrump(Suit.Spades)}
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-2 border-gray-300 transition-all"
        >
          <span className="text-4xl text-black mb-2">{SuitSymbol.Spades}</span>
          <span className="font-semibold text-black">Spades</span>
        </button>
        
        <button
          onClick={() => onSelectTrump(Suit.Hearts)}
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-2 border-gray-300 transition-all"
        >
          <span className="text-4xl text-red-600 mb-2">{SuitSymbol.Hearts}</span>
          <span className="font-semibold text-red-600">Hearts</span>
        </button>
        
        <button
          onClick={() => onSelectTrump(Suit.Diamonds)}
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-2 border-gray-300 transition-all"
        >
          <span className="text-4xl text-red-600 mb-2">{SuitSymbol.Diamonds}</span>
          <span className="font-semibold text-red-600">Diamonds</span>
        </button>
        
        <button
          onClick={() => onSelectTrump(Suit.Clubs)}
          className="flex flex-col items-center justify-center p-4 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-2 border-gray-300 transition-all"
        >
          <span className="text-4xl text-black mb-2">{SuitSymbol.Clubs}</span>
          <span className="font-semibold text-black">Clubs</span>
        </button>
      </div>
    </div>
  );
};