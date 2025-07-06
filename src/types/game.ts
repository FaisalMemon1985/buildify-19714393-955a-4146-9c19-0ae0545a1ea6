
// Card suits and values
export enum Suit {
  Spades = "spades",
  Hearts = "hearts",
  Diamonds = "diamonds",
  Clubs = "clubs"
}

export enum SuitSymbol {
  Spades = "♠",
  Hearts = "♥",
  Diamonds = "♦",
  Clubs = "♣"
}

export enum CardValue {
  Ace = 14,
  King = 13,
  Queen = 12,
  Jack = 11,
  Ten = 10,
  Nine = 9,
  Eight = 8,
  Seven = 7,
  Six = 6,
  Five = 5,
  Four = 4,
  Three = 3,
  Two = 2
}

export const CardValueSymbol: Record<CardValue, string> = {
  [CardValue.Ace]: "A",
  [CardValue.King]: "K",
  [CardValue.Queen]: "Q",
  [CardValue.Jack]: "J",
  [CardValue.Ten]: "10",
  [CardValue.Nine]: "9",
  [CardValue.Eight]: "8",
  [CardValue.Seven]: "7",
  [CardValue.Six]: "6",
  [CardValue.Five]: "5",
  [CardValue.Four]: "4",
  [CardValue.Three]: "3",
  [CardValue.Two]: "2"
};

// Player positions
export enum Position {
  North = "north",
  East = "east",
  South = "south",
  West = "west"
}

// Teams
export enum Team {
  NorthSouth = "north-south",
  EastWest = "east-west"
}

// Game phases
export enum GamePhase {
  Welcome = "welcome",
  Dealing = "dealing",
  Bidding = "bidding",
  TrumpSelection = "trump-selection",
  PartnerReveal = "partner-reveal",
  Playing = "playing",
  RoundEnd = "round-end",
  GameEnd = "game-end"
}

// Card interface
export interface Card {
  suit: Suit;
  value: CardValue;
  id: string; // Unique identifier for animations
  isRevealed?: boolean;
}

// Bid interface
export interface Bid {
  position: Position;
  value: number | null; // null means pass
}

// Trick interface
export interface Trick {
  cards: Record<Position, Card | null>;
  leadSuit: Suit | null;
  winner: Position | null;
}

// Game state interface
export interface GameState {
  phase: GamePhase;
  deck: Card[];
  hands: Record<Position, Card[]>;
  dealer: Position;
  currentTurn: Position;
  trumpSuit: Suit | null;
  bidder: Position | null;
  bids: Bid[];
  currentBid: number | null;
  tricks: Trick[];
  currentTrick: Trick;
  qarz: Record<Team, number>;
  salams: Record<Team, number>;
  revealedHand: boolean;
  animationInProgress: boolean;
}

// Position utilities
export const POSITIONS = [Position.North, Position.East, Position.South, Position.West];
export const POSITION_ORDER = [Position.South, Position.West, Position.North, Position.East];

export const getTeam = (position: Position): Team => {
  return position === Position.North || position === Position.South
    ? Team.NorthSouth
    : Team.EastWest;
};

export const getPartner = (position: Position): Position => {
  switch (position) {
    case Position.North: return Position.South;
    case Position.East: return Position.West;
    case Position.South: return Position.North;
    case Position.West: return Position.East;
  }
};

export const getNextPosition = (position: Position): Position => {
  switch (position) {
    case Position.North: return Position.East;
    case Position.East: return Position.South;
    case Position.South: return Position.West;
    case Position.West: return Position.North;
  }
};

// Card utilities
export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  Object.values(Suit).forEach(suit => {
    Object.values(CardValue).filter(v => typeof v === 'number').forEach(value => {
      deck.push({
        suit: suit as Suit,
        value: value as CardValue,
        id: `${suit}-${value}`
      });
    });
  });
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const sortCards = (cards: Card[], trumpSuit: Suit | null): Card[] => {
  return [...cards].sort((a, b) => {
    // Trump cards are highest
    if (trumpSuit) {
      if (a.suit === trumpSuit && b.suit !== trumpSuit) return 1;
      if (a.suit !== trumpSuit && b.suit === trumpSuit) return -1;
    }
    
    // Sort by suit
    if (a.suit !== b.suit) {
      return Object.values(Suit).indexOf(a.suit) - Object.values(Suit).indexOf(b.suit);
    }
    
    // Sort by value (descending)
    return b.value - a.value;
  });
};