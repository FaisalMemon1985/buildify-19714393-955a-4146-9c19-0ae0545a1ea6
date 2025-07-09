
import React from 'react';
import { Card as CardType, Suit, CardValue, CardValueSymbol, SuitSymbol } from '../../types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isPlayable?: boolean;
  isRevealed?: boolean;
  position?: 'north' | 'east' | 'south' | 'west';
  inTrick?: boolean;
  isWinningCard?: boolean;
}

export const Card: React.FC<CardProps> = ({
  card,
  onClick,
  isPlayable = true,
  isRevealed = true,
  position = 'south',
  inTrick = false,
  isWinningCard = false
}) => {
  const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds;
  
  const getCardTransform = () => {
    if (inTrick) {
      switch (position) {
        case 'north': return 'translate(-50%, -50%) rotate(180deg)';
        case 'east': return 'translate(-50%, -50%) rotate(270deg)';
        case 'south': return 'translate(-50%, -50%)';
        case 'west': return 'translate(-50%, -50%) rotate(90deg)';
      }
    }
    
    return '';
  };
  
  const getCardPosition = () => {
    if (inTrick) {
      switch (position) {
        case 'north': return 'top-[30%] left-1/2';
        case 'east': return 'top-1/2 right-[30%]';
        case 'south': return 'bottom-[30%] left-1/2';
        case 'west': return 'top-1/2 left-[30%]';
      }
    }
    
    return '';
  };
  
  if (!isRevealed) {
    return (
      <div 
        className={`
          relative w-20 h-28 rounded-lg bg-gradient-to-br from-red-800 to-red-950
          border-2 border-white shadow-md cursor-default
          ${position === 'north' ? 'transform rotate-180' : ''}
          ${position === 'east' ? 'transform rotate-270' : ''}
          ${position === 'west' ? 'transform rotate-90' : ''}
          ${inTrick ? `absolute ${getCardPosition()} transform ${getCardTransform()}` : ''}
        `}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-20 rounded border-2 border-white/30 bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center">
            <div className="text-white font-bold text-lg sindhi-font">چوباز</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative w-20 h-28 rounded-lg bg-white border-2 shadow-md
        ${isPlayable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all' : 'cursor-default'}
        ${!isPlayable ? 'opacity-70' : ''}
        ${isWinningCard ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
        ${inTrick ? `absolute ${getCardPosition()} transform ${getCardTransform()}` : ''}
      `}
    >
      <div className={`absolute top-1 left-1 font-bold text-sm ${isRed ? 'text-red-600' : 'text-black'}`}>
        {CardValueSymbol[card.value]}
      </div>
      
      <div className={`absolute top-4 left-1 text-lg ${isRed ? 'text-red-600' : 'text-black'}`}>
        {SuitSymbol[card.suit]}
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-3xl ${isRed ? 'text-red-600' : 'text-black'}`}>
          {SuitSymbol[card.suit]}
        </div>
      </div>
      
      <div className={`absolute bottom-4 right-1 text-lg transform rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
        {SuitSymbol[card.suit]}
      </div>
      
      <div className={`absolute bottom-1 right-1 font-bold text-sm transform rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
        {CardValueSymbol[card.value]}
      </div>
    </div>
  );
};