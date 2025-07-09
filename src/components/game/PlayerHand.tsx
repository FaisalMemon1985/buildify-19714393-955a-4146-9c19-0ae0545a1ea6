
import React from 'react';
import { Card as CardType, Position, Suit } from '../../types/game';
import { Card } from './Card';
import { getPlayableCards } from '../../utils/gameLogic';

interface PlayerHandProps {
  cards: CardType[];
  position: Position;
  onCardClick?: (card: CardType) => void;
  isCurrentTurn: boolean;
  leadSuit: Suit | null;
  trumpSuit: Suit | null;
  isRevealed?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  position,
  onCardClick,
  isCurrentTurn,
  leadSuit,
  trumpSuit,
  isRevealed = false
}) => {
  const playableCards = isCurrentTurn 
    ? getPlayableCards(cards, leadSuit, trumpSuit)
    : [];
  
  const getPositionClass = () => {
    switch (position) {
      case Position.North:
        return 'top-4 left-1/2 transform -translate-x-1/2 flex-row-reverse';
      case Position.East:
        return 'top-1/2 right-4 transform -translate-y-1/2 flex-col';
      case Position.South:
        return 'bottom-4 left-1/2 transform -translate-x-1/2 flex-row';
      case Position.West:
        return 'top-1/2 left-4 transform -translate-y-1/2 flex-col-reverse';
    }
  };
  
  const getCardRotation = () => {
    switch (position) {
      case Position.North:
        return 'rotate-180';
      case Position.East:
        return 'rotate-90';
      case Position.West:
        return '-rotate-90';
      default:
        return '';
    }
  };
  
  const isVertical = position === Position.East || position === Position.West;
  
  // Determine if cards should be revealed
  const shouldRevealCards = position === Position.South || isRevealed;
  
  return (
    <div className={`absolute ${getPositionClass()} flex ${isCurrentTurn ? 'z-10' : 'z-0'}`}>
      {cards.map((card, index) => (
        <div 
          key={card.id}
          className={`
            ${isVertical ? '-mb-16' : '-mr-8'} 
            ${isCurrentTurn && playableCards.some(c => c.id === card.id) ? 'hover:-translate-y-4 transition-transform' : ''}
            ${getCardRotation()}
          `}
          style={{ zIndex: index }}
        >
          <Card 
            card={card}
            onClick={() => onCardClick && isCurrentTurn && playableCards.some(c => c.id === card.id) && onCardClick(card)}
            isPlayable={isCurrentTurn && playableCards.some(c => c.id === card.id)}
            isRevealed={shouldRevealCards}
            position={position.toLowerCase() as any}
          />
        </div>
      ))}
    </div>
  );
};