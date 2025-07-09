
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  Card, GameState, GamePhase, Position, Suit, Team, Trick, Bid,
  createDeck, shuffleDeck, sortCards, getNextPosition, getTeam, getPartner
} from '../types/game';
import { evaluateHandStrength, getPlayableCards, determineWinner, selectCardToPlay } from '../utils/gameLogic';

// Action types
type GameAction = 
  | { type: 'START_GAME' }
  | { type: 'DEAL_CARDS' }
  | { type: 'START_BIDDING' }
  | { type: 'PLACE_BID', position: Position, value: number | null }
  | { type: 'SELECT_TRUMP', suit: Suit }
  | { type: 'REVEAL_PARTNER_HAND' }
  | { type: 'PLAY_CARD', position: Position, card: Card }
  | { type: 'COMPLETE_TRICK' }
  | { type: 'END_ROUND' }
  | { type: 'RESET_ROUND' }
  | { type: 'SET_ANIMATION_STATUS', inProgress: boolean };

// Initial state
const initialState: GameState = {
  phase: GamePhase.Welcome,
  deck: [],
  hands: {
    [Position.North]: [],
    [Position.East]: [],
    [Position.South]: [],
    [Position.West]: []
  },
  dealer: Position.West, // West always deals first
  currentTurn: Position.South, // South always starts bidding
  trumpSuit: null,
  bidder: null,
  bids: [],
  currentBid: null,
  tricks: [],
  currentTrick: {
    cards: {
      [Position.North]: null,
      [Position.East]: null,
      [Position.South]: null,
      [Position.West]: null
    },
    leadSuit: null,
    winner: null
  },
  qarz: {
    [Team.NorthSouth]: 0,
    [Team.EastWest]: 0
  },
  salams: {
    [Team.NorthSouth]: 0,
    [Team.EastWest]: 0
  },
  revealedHand: false,
  animationInProgress: false
};

// Reducer function
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialState,
        phase: GamePhase.Dealing,
        deck: shuffleDeck(createDeck())
      };
      
    case 'DEAL_CARDS': {
      const hands = {
        [Position.North]: [],
        [Position.East]: [],
        [Position.South]: [],
        [Position.West]: []
      };
      
      // Deal 13 cards to each player
      const deck = [...state.deck];
      let currentPosition = state.dealer;
      
      for (let i = 0; i < 52; i++) {
        currentPosition = getNextPosition(currentPosition);
        hands[currentPosition].push(deck[i]);
      }
      
      // Sort cards in each hand
      Object.keys(hands).forEach(pos => {
        hands[pos as Position] = sortCards(hands[pos as Position], null);
      });
      
      return {
        ...state,
        hands,
        phase: GamePhase.Bidding,
        currentTurn: Position.South // South always starts bidding
      };
    }
    
    case 'START_BIDDING':
      return {
        ...state,
        phase: GamePhase.Bidding,
        bids: [],
        currentBid: null
      };
      
    case 'PLACE_BID': {
      const newBids = [...state.bids, { position: action.position, value: action.value }];
      let newCurrentBid = state.currentBid;
      let newBidder = state.bidder;
      
      // Update current bid if this is a valid bid (not a pass)
      if (action.value !== null && (state.currentBid === null || action.value > state.currentBid)) {
        newCurrentBid = action.value;
        newBidder = action.position;
      }
      
      // Check if bidding is complete
      let newPhase = state.phase;
      let newCurrentTurn = getNextPosition(action.position);
      
      // Bidding is complete if all players have bid or if three players have passed
      const passCount = newBids.filter(bid => bid.value === null).length;
      const allBid = newBids.length === 4;
      
      if (allBid || passCount === 3) {
        if (newCurrentBid !== null && newBidder !== null) {
          newPhase = GamePhase.TrumpSelection;
          newCurrentTurn = newBidder;
        } else {
          // No one bid, reset the round
          return gameReducer(state, { type: 'RESET_ROUND' });
        }
      }
      
      return {
        ...state,
        bids: newBids,
        currentBid: newCurrentBid,
        bidder: newBidder,
        phase: newPhase,
        currentTurn: newCurrentTurn
      };
    }
    
    case 'SELECT_TRUMP':
      return {
        ...state,
        trumpSuit: action.suit,
        phase: GamePhase.PartnerReveal,
        // Sort cards again now that we know the trump
        hands: Object.entries(state.hands).reduce((acc, [pos, cards]) => {
          acc[pos as Position] = sortCards(cards, action.suit);
          return acc;
        }, {} as Record<Position, Card[]>)
      };
      
    case 'REVEAL_PARTNER_HAND': {
      const bidderPartner = getPartner(state.bidder!);
      
      return {
        ...state,
        revealedHand: true,
        phase: GamePhase.Playing,
        currentTurn: Position.South, // South always leads the first trick
        hands: {
          ...state.hands,
          [bidderPartner]: state.hands[bidderPartner].map(card => ({ ...card, isRevealed: true }))
        }
      };
    }
    
    case 'PLAY_CARD': {
      const { position, card } = action;
      
      // Remove card from player's hand
      const newHands = { ...state.hands };
      newHands[position] = newHands[position].filter(c => c.id !== card.id);
      
      // Add card to current trick
      const newCurrentTrick = { ...state.currentTrick };
      newCurrentTrick.cards[position] = card;
      
      // Set lead suit if this is the first card
      if (!newCurrentTrick.leadSuit) {
        newCurrentTrick.leadSuit = card.suit;
      }
      
      // Determine next player
      let newCurrentTurn = getNextPosition(position);
      
      // Check if trick is complete
      const trickComplete = Object.values(newCurrentTrick.cards).every(c => c !== null);
      
      if (trickComplete) {
        // Determine winner
        const winner = determineWinner(newCurrentTrick.cards, newCurrentTrick.leadSuit!, state.trumpSuit);
        newCurrentTrick.winner = winner;
        newCurrentTurn = winner; // Winner leads next trick
      }
      
      return {
        ...state,
        hands: newHands,
        currentTrick: newCurrentTrick,
        currentTurn: newCurrentTurn,
        phase: trickComplete ? GamePhase.RoundEnd : GamePhase.Playing
      };
    }
    
    case 'COMPLETE_TRICK': {
      // Add current trick to tricks array
      const newTricks = [...state.tricks, state.currentTrick];
      
      // Check if round is complete
      if (newTricks.length === 13) {
        // Calculate tricks won by each team
        const northSouthTricks = newTricks.filter(
          trick => trick.winner === Position.North || trick.winner === Position.South
        ).length;
        const eastWestTricks = 13 - northSouthTricks;
        
        // Update qarz based on bid result
        let newQarz = { ...state.qarz };
        let newSalams = { ...state.salams };
        const bidderTeam = getTeam(state.bidder!);
        const opponentTeam = bidderTeam === Team.NorthSouth ? Team.EastWest : Team.NorthSouth;
        
        const bidderTricks = bidderTeam === Team.NorthSouth ? northSouthTricks : eastWestTricks;
        
        // Check if bidder met their bid
        if (bidderTricks >= state.currentBid!) {
          // Bidder met or exceeded bid
          if (newQarz[bidderTeam] > 0) {
            // Reduce bidder's qarz first
            newQarz[bidderTeam] = Math.max(0, newQarz[bidderTeam] - bidderTricks);
          } else {
            // Add to opponent's qarz
            newQarz[opponentTeam] += bidderTricks;
          }
          
          // Check for Mubri (all 13 tricks)
          if (bidderTricks === 13) {
            // Reset all qarz and award a Salam
            newQarz = { [Team.NorthSouth]: 0, [Team.EastWest]: 0 };
            newSalams[bidderTeam]++;
          }
          
          // Check for Salam (52+ qarz)
          if (newQarz[opponentTeam] >= 52) {
            newSalams[bidderTeam]++;
            newQarz[opponentTeam] = 0;
          }
        } else {
          // Bidder failed to meet bid
          const shortBy = state.currentBid! - bidderTricks;
          const penalty = state.currentBid! * (shortBy + 1);
          
          if (newQarz[opponentTeam] > 0) {
            // Reduce opponent's qarz first
            newQarz[opponentTeam] = Math.max(0, newQarz[opponentTeam] - penalty);
          } else {
            // Add to bidder's qarz
            newQarz[bidderTeam] += penalty;
          }
          
          // Check for Salam (52+ qarz)
          if (newQarz[bidderTeam] >= 52) {
            newSalams[opponentTeam]++;
            newQarz[bidderTeam] = 0;
          }
        }
        
        return {
          ...state,
          tricks: newTricks,
          currentTrick: {
            cards: {
              [Position.North]: null,
              [Position.East]: null,
              [Position.South]: null,
              [Position.West]: null
            },
            leadSuit: null,
            winner: null
          },
          qarz: newQarz,
          salams: newSalams,
          phase: GamePhase.RoundEnd
        };
      }
      
      // Start next trick
      return {
        ...state,
        tricks: newTricks,
        currentTrick: {
          cards: {
            [Position.North]: null,
            [Position.East]: null,
            [Position.South]: null,
            [Position.West]: null
          },
          leadSuit: null,
          winner: null
        },
        phase: GamePhase.Playing
      };
    }
    
    case 'END_ROUND':
      return {
        ...state,
        phase: GamePhase.GameEnd
      };
      
    case 'RESET_ROUND':
      return {
        ...state,
        phase: GamePhase.Dealing,
        deck: shuffleDeck(createDeck()),
        hands: {
          [Position.North]: [],
          [Position.East]: [],
          [Position.South]: [],
          [Position.West]: []
        },
        dealer: getNextPosition(state.dealer), // Rotate dealer
        currentTurn: Position.South, // South always starts bidding
        trumpSuit: null,
        bidder: null,
        bids: [],
        currentBid: null,
        tricks: [],
        currentTrick: {
          cards: {
            [Position.North]: null,
            [Position.East]: null,
            [Position.South]: null,
            [Position.West]: null
          },
          leadSuit: null,
          winner: null
        },
        revealedHand: false
      };
      
    case 'SET_ANIMATION_STATUS':
      return {
        ...state,
        animationInProgress: action.inProgress
      };
      
    default:
      return state;
  }
};

// Context
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  placeBid: (position: Position, value: number | null) => void;
  selectTrump: (suit: Suit) => void;
  playCard: (position: Position, card: Card) => void;
  startNewRound: () => void;
  startNewGame: () => void;
  botAction: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Helper functions
  const placeBid = (position: Position, value: number | null) => {
    if (state.phase !== GamePhase.Bidding || state.currentTurn !== position) return;
    
    // Validate bid
    if (value !== null && (state.currentBid === null || value > state.currentBid)) {
      if (value >= 8 && value <= 13) {
        dispatch({ type: 'PLACE_BID', position, value });
      }
    } else if (value === null) {
      // Pass
      dispatch({ type: 'PLACE_BID', position, value: null });
    }
  };
  
  const selectTrump = (suit: Suit) => {
    if (state.phase !== GamePhase.TrumpSelection || state.currentTurn !== state.bidder) return;
    dispatch({ type: 'SELECT_TRUMP', suit });
    
    // Automatically reveal partner's hand after trump selection
    setTimeout(() => {
      dispatch({ type: 'REVEAL_PARTNER_HAND' });
    }, 1000);
  };
  
  const playCard = (position: Position, card: Card) => {
    if (state.phase !== GamePhase.Playing || state.currentTurn !== position) return;
    
    // Check if card is playable
    const playableCards = getPlayableCards(
      state.hands[position],
      state.currentTrick.leadSuit,
      state.trumpSuit
    );
    
    if (playableCards.some(c => c.id === card.id)) {
      dispatch({ type: 'PLAY_CARD', position, card });
      
      // Check if trick is complete
      const trickComplete = Object.values({
        ...state.currentTrick.cards,
        [position]: card
      }).every(c => c !== null);
      
      if (trickComplete) {
        setTimeout(() => {
          dispatch({ type: 'COMPLETE_TRICK' });
        }, 1500);
      }
    }
  };
  
  const startNewRound = () => {
    dispatch({ type: 'RESET_ROUND' });
    
    // Automatically deal cards
    setTimeout(() => {
      dispatch({ type: 'DEAL_CARDS' });
    }, 1000);
  };
  
  const startNewGame = () => {
    dispatch({ type: 'START_GAME' });
    
    // Automatically deal cards
    setTimeout(() => {
      dispatch({ type: 'DEAL_CARDS' });
    }, 1000);
  };
  
  // Bot action logic
  const botAction = () => {
    if (state.animationInProgress) return;
    
    const currentPosition = state.currentTurn;
    
    // Skip if it's the human player's turn
    if (currentPosition === Position.South) return;
    
    // Skip if partner's hand is revealed and bidder is human
    if (state.revealedHand && state.bidder === Position.South && 
        (currentPosition === Position.North)) return;
    
    // Bot bidding logic
    if (state.phase === GamePhase.Bidding) {
      const handStrength = evaluateHandStrength(state.hands[currentPosition]);
      let bidValue: number | null = null;
      
      // Determine bid based on hand strength
      if (handStrength >= 75) bidValue = 13;
      else if (handStrength >= 65) bidValue = 12;
      else if (handStrength >= 55) bidValue = 11;
      else if (handStrength >= 45) bidValue = 10;
      else if (handStrength >= 35) bidValue = 9;
      else if (handStrength >= 25) bidValue = 8;
      
      // Adjust bid based on current highest bid
      if (bidValue !== null && state.currentBid !== null && bidValue <= state.currentBid) {
        bidValue = null; // Pass if can't outbid
      }
      
      setTimeout(() => {
        placeBid(currentPosition, bidValue);
      }, 1000);
    }
    
    // Bot trump selection logic
    else if (state.phase === GamePhase.TrumpSelection && currentPosition === state.bidder) {
      // Count cards by suit
      const suitCounts: Record<Suit, number> = {
        [Suit.Spades]: 0,
        [Suit.Hearts]: 0,
        [Suit.Diamonds]: 0,
        [Suit.Clubs]: 0
      };
      
      // Count high cards by suit
      const highCardCounts: Record<Suit, number> = {
        [Suit.Spades]: 0,
        [Suit.Hearts]: 0,
        [Suit.Diamonds]: 0,
        [Suit.Clubs]: 0
      };
      
      state.hands[currentPosition].forEach(card => {
        suitCounts[card.suit]++;
        if (card.value >= 11) { // Jack or higher
          highCardCounts[card.suit]++;
        }
      });
      
      // Choose suit with most cards, breaking ties with high cards
      let bestSuit = Suit.Spades;
      let bestCount = 0;
      let bestHighCount = 0;
      
      Object.values(Suit).forEach(suit => {
        if (suitCounts[suit] > bestCount || 
            (suitCounts[suit] === bestCount && highCardCounts[suit] > bestHighCount)) {
          bestSuit = suit;
          bestCount = suitCounts[suit];
          bestHighCount = highCardCounts[suit];
        }
      });
      
      setTimeout(() => {
        selectTrump(bestSuit);
      }, 1000);
    }
    
    // Bot card playing logic
    else if (state.phase === GamePhase.Playing) {
      // If partner's hand is revealed and current player is partner, skip
      if (state.revealedHand && 
          currentPosition === getPartner(state.bidder!) && 
          state.bidder !== Position.South) {
        return;
      }
      
      // Select card to play
      const card = selectCardToPlay(
        state.hands[currentPosition],
        state.currentTrick,
        state.trumpSuit,
        state.tricks,
        currentPosition,
        state.bidder,
        state.currentBid || 0
      );
      
      if (card) {
        setTimeout(() => {
          playCard(currentPosition, card);
        }, 1000);
      }
    }
  };
  
  // Effect to trigger bot actions
  useEffect(() => {
    // Skip bot action if human controls this position
    const humanControlsPosition = state.currentTurn === Position.South || 
      (state.revealedHand && state.bidder === Position.South && 
       state.currentTurn === getPartner(Position.South));
    
    if (!humanControlsPosition && 
        [GamePhase.Bidding, GamePhase.TrumpSelection, GamePhase.Playing].includes(state.phase)) {
      const timer = setTimeout(() => {
        botAction();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [state.currentTurn, state.phase, state.animationInProgress, state.revealedHand, state.bidder]);
  
  // Effect to automatically deal cards when game starts
  useEffect(() => {
    if (state.phase === GamePhase.Dealing && state.deck.length > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'DEAL_CARDS' });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.deck]);
  
  return (
    <GameContext.Provider value={{ 
      state, 
      dispatch, 
      placeBid, 
      selectTrump, 
      playCard, 
      startNewRound, 
      startNewGame,
      botAction
    }}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};