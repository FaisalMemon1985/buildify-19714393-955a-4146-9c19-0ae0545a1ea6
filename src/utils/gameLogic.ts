
import { 
  Card, Position, Suit, Trick, CardValue,
  getTeam, getPartner
} from '../types/game';

// Evaluate hand strength for bidding
export const evaluateHandStrength = (hand: Card[]): number => {
  let strength = 0;
  
  // Count high cards
  hand.forEach(card => {
    // Add points for high cards
    if (card.value === CardValue.Ace) strength += 4;
    else if (card.value === CardValue.King) strength += 3;
    else if (card.value === CardValue.Queen) strength += 2;
    else if (card.value === CardValue.Jack) strength += 1;
    
    // Add points for suit distribution
    const suitCards = hand.filter(c => c.suit === card.suit).length;
    if (suitCards === 1) strength += 2; // Singleton
    else if (suitCards === 0) strength += 3; // Void
  });
  
  // Check suit distribution
  const suitCounts: Record<string, number> = {};
  hand.forEach(card => {
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
  });
  
  // Add points for long suits
  Object.values(suitCounts).forEach(count => {
    if (count >= 5) strength += count - 3;
  });
  
  return strength;
};

// Get playable cards based on lead suit and trump
export const getPlayableCards = (
  hand: Card[],
  leadSuit: Suit | null,
  trumpSuit: Suit | null
): Card[] => {
  // If no lead suit, any card can be played
  if (!leadSuit) return hand;
  
  // Check if player has any cards of lead suit
  const leadSuitCards = hand.filter(card => card.suit === leadSuit);
  
  if (leadSuitCards.length > 0) {
    // Must follow suit
    return leadSuitCards;
  }
  
  // If no lead suit cards, check if player has trump
  if (trumpSuit) {
    const trumpCards = hand.filter(card => card.suit === trumpSuit);
    
    // If this is not the first card and player has trump, must play trump
    if (trumpCards.length > 0) {
      return trumpCards;
    }
  }
  
  // If no lead suit and no trump, any card can be played
  return hand;
};

// Determine the winner of a trick
export const determineWinner = (
  cards: Record<Position, Card | null>,
  leadSuit: Suit,
  trumpSuit: Suit | null
): Position => {
  let winningPosition: Position = Position.South; // Default
  let winningCard: Card | null = null;
  
  Object.entries(cards).forEach(([position, card]) => {
    if (!card) return;
    
    if (!winningCard) {
      winningCard = card;
      winningPosition = position as Position;
      return;
    }
    
    // Trump beats any non-trump
    if (trumpSuit) {
      if (card.suit === trumpSuit && winningCard.suit !== trumpSuit) {
        winningCard = card;
        winningPosition = position as Position;
        return;
      }
      
      if (winningCard.suit === trumpSuit && card.suit !== trumpSuit) {
        return;
      }
    }
    
    // If both cards are trump or both are not trump
    if (card.suit === winningCard.suit) {
      // Higher value wins
      if (card.value > winningCard.value) {
        winningCard = card;
        winningPosition = position as Position;
      }
    } else if (card.suit === leadSuit) {
      // Lead suit beats non-lead, non-trump
      if (winningCard.suit !== trumpSuit) {
        winningCard = card;
        winningPosition = position as Position;
      }
    }
  });
  
  return winningPosition;
};

// AI logic to select a card to play
export const selectCardToPlay = (
  hand: Card[],
  currentTrick: Trick,
  trumpSuit: Suit | null,
  tricks: Trick[],
  position: Position,
  bidder: Position | null,
  bid: number
): Card | null => {
  // Get playable cards
  const playableCards = getPlayableCards(hand, currentTrick.leadSuit, trumpSuit);
  if (playableCards.length === 0) return null;
  
  // If only one card is playable, play it
  if (playableCards.length === 1) return playableCards[0];
  
  // Check if this is the first card in the trick
  const isFirstCard = Object.values(currentTrick.cards).every(card => card === null);
  
  // Check if this is the last card in the trick
  const isLastCard = Object.values(currentTrick.cards).filter(card => card !== null).length === 3;
  
  // Get partner position
  const partner = getPartner(position);
  
  // Get team
  const team = getTeam(position);
  const bidderTeam = bidder ? getTeam(bidder) : null;
  
  // Check if partner has played in this trick
  const partnerCard = currentTrick.cards[partner];
  
  // Check if partner is currently winning the trick
  let currentWinner = null;
  let highestCard = null;
  
  if (!isFirstCard) {
    const playedCards = Object.entries(currentTrick.cards)
      .filter(([_, card]) => card !== null)
      .map(([pos, card]) => ({ position: pos as Position, card: card! }));
    
    playedCards.forEach(({ position, card }) => {
      if (!highestCard) {
        highestCard = card;
        currentWinner = position;
        return;
      }
      
      // Trump beats any non-trump
      if (trumpSuit) {
        if (card.suit === trumpSuit && highestCard.suit !== trumpSuit) {
          highestCard = card;
          currentWinner = position;
          return;
        }
        
        if (highestCard.suit === trumpSuit && card.suit !== trumpSuit) {
          return;
        }
      }
      
      // If both cards are trump or both are not trump
      if (card.suit === highestCard.suit) {
        // Higher value wins
        if (card.value > highestCard.value) {
          highestCard = card;
          currentWinner = position;
        }
      } else if (card.suit === currentTrick.leadSuit) {
        // Lead suit beats non-lead, non-trump
        if (highestCard.suit !== trumpSuit) {
          highestCard = card;
          currentWinner = position;
        }
      }
    });
  }
  
  const partnerWinning = currentWinner === partner;
  
  // Strategy for first card in trick
  if (isFirstCard) {
    // Lead with highest card in longest suit if bidder team
    if (bidderTeam === team) {
      // Count cards by suit
      const suitCounts: Record<string, number> = {};
      hand.forEach(card => {
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
      });
      
      // Find longest suit
      let longestSuit = null;
      let longestCount = 0;
      
      Object.entries(suitCounts).forEach(([suit, count]) => {
        if (count > longestCount) {
          longestSuit = suit;
          longestCount = count;
        }
      });
      
      // Lead with highest card in longest suit
      if (longestSuit) {
        const suitCards = hand.filter(card => card.suit === longestSuit);
        return suitCards[0]; // Highest card (since hand is sorted)
      }
    } else {
      // If not bidder team, lead with lowest card
      return playableCards[playableCards.length - 1];
    }
  }
  
  // Strategy for last card in trick
  if (isLastCard) {
    // If partner is winning and on same team, play lowest card
    if (partnerWinning && getTeam(partner) === team) {
      return playableCards[playableCards.length - 1];
    }
    
    // If opponent is winning, try to win with lowest winning card
    const opponentCard = highestCard;
    if (opponentCard) {
      // Find lowest card that can win
      for (let i = playableCards.length - 1; i >= 0; i--) {
        const card = playableCards[i];
        
        // Trump beats non-trump
        if (trumpSuit && card.suit === trumpSuit && opponentCard.suit !== trumpSuit) {
          return card;
        }
        
        // If same suit, higher value wins
        if (card.suit === opponentCard.suit && card.value > opponentCard.value) {
          return card;
        }
      }
    }
  }
  
  // Middle of trick strategy
  
  // If partner played and is winning, play lowest card
  if (partnerCard && partnerWinning) {
    return playableCards[playableCards.length - 1];
  }
  
  // If must follow suit and can't win, play lowest card
  if (currentTrick.leadSuit && playableCards.every(card => card.suit === currentTrick.leadSuit)) {
    if (highestCard && highestCard.suit === currentTrick.leadSuit && 
        playableCards.every(card => card.value < highestCard.value)) {
      return playableCards[playableCards.length - 1];
    }
  }
  
  // If can win, play lowest winning card
  if (highestCard) {
    for (let i = playableCards.length - 1; i >= 0; i--) {
      const card = playableCards[i];
      
      // Trump beats non-trump
      if (trumpSuit && card.suit === trumpSuit && highestCard.suit !== trumpSuit) {
        return card;
      }
      
      // If same suit, higher value wins
      if (card.suit === highestCard.suit && card.value > highestCard.value) {
        return card;
      }
    }
  }
  
  // Default: play lowest card
  return playableCards[playableCards.length - 1];
};