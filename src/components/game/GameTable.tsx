
import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { PlayerHand } from './PlayerHand';
import { Card } from './Card';
import { BiddingPanel } from './BiddingPanel';
import { TrumpSelector } from './TrumpSelector';
import { GamePhase, Position, Suit, SuitSymbol, Team } from '../../types/game';
import { getTeam, getPartner } from '../../types/game';

export const GameTable: React.FC = () => {
  const { 
    state, 
    placeBid, 
    selectTrump, 
    playCard, 
    startNewRound, 
    startNewGame 
  } = useGame();
  
  // Handle player bid
  const handleBid = (value: number | null) => {
    placeBid(Position.South, value);
  };
  
  // Handle trump selection
  const handleTrumpSelection = (suit: Suit) => {
    selectTrump(suit);
  };
  
  // Handle card play
  const handleCardPlay = (card: any) => {
    // Check if it's the human player's turn or if they control their partner
    if (state.currentTurn === Position.South) {
      playCard(Position.South, card);
    } else if (state.revealedHand && state.bidder === Position.South && 
               state.currentTurn === getPartner(Position.South)) {
      // Human controls their partner's cards when they are the bidder
      playCard(state.currentTurn, card);
    }
  };
  
  // Get current trick winner if all cards played
  const currentTrickWinner = () => {
    const { currentTrick } = state;
    if (Object.values(currentTrick.cards).every(card => card !== null)) {
      return currentTrick.winner;
    }
    return null;
  };
  
  // Get player name
  const getPlayerName = (position: Position) => {
    switch (position) {
      case Position.North: return "North (Partner)";
      case Position.East: return "East";
      case Position.South: return "You (South)";
      case Position.West: return "West";
    }
  };
  
  // Get bid display
  const getBidDisplay = () => {
    if (state.currentBid === null) return "No bids yet";
    
    const bidder = state.bidder ? getPlayerName(state.bidder) : "Unknown";
    return `${bidder}: ${state.currentBid}`;
  };
  
  // Render turn indicator
  const renderTurnIndicator = () => {
    if (state.phase !== GamePhase.Bidding && state.phase !== GamePhase.Playing) return null;
    
    const getPositionClass = () => {
      switch (state.currentTurn) {
        case Position.North:
          return 'top-16 left-1/2 transform -translate-x-1/2';
        case Position.East:
          return 'top-1/2 right-16 transform -translate-y-1/2';
        case Position.South:
          return 'bottom-16 left-1/2 transform -translate-x-1/2';
        case Position.West:
          return 'top-1/2 left-16 transform -translate-y-1/2';
      }
    };
    
    return (
      <div className={`absolute ${getPositionClass()} w-8 h-8 rounded-full bg-yellow-400 animate-pulse z-20`} />
    );
  };
  
  // Render game info panel
  const renderGameInfo = () => {
    return (
      <div className="absolute top-4 right-4 bg-white/80 p-3 rounded-lg shadow-md border border-red-800 w-64">
        <h3 className="text-lg font-bold text-red-900 mb-2">Game Info</h3>
        
        {state.phase !== GamePhase.Welcome && (
          <>
            <div className="mb-2">
              <span className="font-semibold">Dealer: </span>
              <span>{getPlayerName(state.dealer)}</span>
            </div>
            
            {state.phase !== GamePhase.Dealing && (
              <div className="mb-2">
                <span className="font-semibold">Current Bid: </span>
                <span>{getBidDisplay()}</span>
              </div>
            )}
            
            {state.trumpSuit && (
              <div className="mb-2">
                <span className="font-semibold">Trump (رنگ): </span>
                <span className={state.trumpSuit === Suit.Hearts || state.trumpSuit === Suit.Diamonds ? 'text-red-600' : 'text-black'}>
                  {SuitSymbol[state.trumpSuit]} {state.trumpSuit}
                </span>
              </div>
            )}
            
            <div className="mb-2">
              <span className="font-semibold">Tricks: </span>
              <span>{state.tricks.length}/13</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-blue-100 p-2 rounded">
                <div className="text-sm font-semibold">N/S Team</div>
                <div className="text-lg font-bold">{state.qarz[Team.NorthSouth]} Qarz</div>
                <div className="text-sm">{state.salams[Team.NorthSouth]} Salams</div>
              </div>
              
              <div className="bg-red-100 p-2 rounded">
                <div className="text-sm font-semibold">E/W Team</div>
                <div className="text-lg font-bold">{state.qarz[Team.EastWest]} Qarz</div>
                <div className="text-sm">{state.salams[Team.EastWest]} Salams</div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };
  
  // Render bids history
  const renderBidsHistory = () => {
    if (state.bids.length === 0) return null;
    
    return (
      <div className="absolute top-4 left-4 bg-white/80 p-3 rounded-lg shadow-md border border-red-800 w-64">
        <h3 className="text-lg font-bold text-red-900 mb-2">Bidding History</h3>
        
        <div className="space-y-1">
          {state.bids.map((bid, index) => (
            <div key={index} className="flex justify-between">
              <span>{getPlayerName(bid.position)}:</span>
              <span className="font-semibold">{bid.value === null ? 'Pass' : bid.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render current trick
  const renderCurrentTrick = () => {
    if (state.phase !== GamePhase.Playing && state.phase !== GamePhase.RoundEnd) return null;
    
    const winner = currentTrickWinner();
    
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {Object.entries(state.currentTrick.cards).map(([position, card]) => {
          if (!card) return null;
          
          return (
            <Card 
              key={card.id}
              card={card}
              inTrick={true}
              position={position.toLowerCase() as any}
              isWinningCard={winner === position}
            />
          );
        })}
      </div>
    );
  };
  
  // Render round end overlay
  const renderRoundEnd = () => {
    if (state.phase !== GamePhase.RoundEnd) return null;
    
    // Calculate tricks won by each team
    const northSouthTricks = state.tricks.filter(
      trick => trick.winner === Position.North || trick.winner === Position.South
    ).length;
    const eastWestTricks = 13 - northSouthTricks;
    
    // Determine if bidder met their bid
    const bidderTeam = getTeam(state.bidder!);
    const bidderTricks = bidderTeam === Team.NorthSouth ? northSouthTricks : eastWestTricks;
    const bidMet = bidderTricks >= (state.currentBid || 0);
    
    return (
      <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-center text-red-900 mb-4">Round Complete</h2>
          
          <div className="mb-4">
            <div className="text-center mb-2">
              <span className="font-semibold">Bid: </span>
              <span>{state.currentBid} by {getPlayerName(state.bidder!)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded text-center">
                <div className="font-semibold">North/South</div>
                <div className="text-2xl font-bold">{northSouthTricks}</div>
                <div>tricks</div>
              </div>
              
              <div className="bg-red-100 p-3 rounded text-center">
                <div className="font-semibold">East/West</div>
                <div className="text-2xl font-bold">{eastWestTricks}</div>
                <div>tricks</div>
              </div>
            </div>
            
            <div className="text-center mb-4">
              <div className={`text-xl font-bold ${bidMet ? 'text-green-600' : 'text-red-600'}`}>
                {bidMet 
                  ? `Bid met! ${bidderTricks} tricks won (needed ${state.currentBid})`
                  : `Bid failed! ${bidderTricks} tricks won (needed ${state.currentBid})`
                }
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-100 p-3 rounded text-center">
                <div className="font-semibold">N/S Qarz</div>
                <div className="text-2xl font-bold">{state.qarz[Team.NorthSouth]}</div>
                <div>{state.salams[Team.NorthSouth]} Salams</div>
              </div>
              
              <div className="bg-red-100 p-3 rounded text-center">
                <div className="font-semibold">E/W Qarz</div>
                <div className="text-2xl font-bold">{state.qarz[Team.EastWest]}</div>
                <div>{state.salams[Team.EastWest]} Salams</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={startNewRound}
            className="w-full py-3 rounded-md bg-gradient-to-br from-red-700 to-red-900 text-white font-bold text-lg hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all"
          >
            Next Round
          </button>
        </div>
      </div>
    );
  };
  
  // Render welcome screen
  const renderWelcome = () => {
    if (state.phase !== GamePhase.Welcome) return null;
    
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-red-900 to-red-950 flex flex-col items-center justify-center z-50">
        <div className="text-center mb-8">
          <div className="text-white text-xl mb-2">Indus Apps presents</div>
          <h1 className="text-6xl font-bold text-white mb-2">چوباز</h1>
          <h2 className="text-3xl text-white">Chobaz</h2>
        </div>
        
        <div className="bg-white/90 p-6 rounded-lg shadow-lg max-w-md w-full mb-8">
          <h3 className="text-xl font-bold text-red-900 mb-4 text-center">Game Mode</h3>
          
          <div className="space-y-3">
            <button
              onClick={startNewGame}
              className="w-full py-3 rounded-md bg-gradient-to-br from-red-700 to-red-900 text-white font-bold text-lg hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all"
            >
              Single Player
            </button>
            
            <button
              disabled
              className="w-full py-3 rounded-md bg-gray-300 text-gray-500 font-bold text-lg cursor-not-allowed"
            >
              Multiplayer (Coming Soon)
            </button>
          </div>
        </div>
        
        <div className="text-white text-sm opacity-70">
          A traditional Court Piece card game with Sindhi rules
        </div>
      </div>
    );
  };
  
  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-red-800 to-red-950 overflow-hidden">
      {/* Game table */}
      <div className="absolute inset-10 bg-green-800 rounded-3xl shadow-2xl overflow-hidden border-8 border-brown-900">
        {/* Ajrak pattern overlay */}
        <div className="absolute inset-0 bg-[url('/ajrak-pattern.png')] opacity-10"></div>
        
        {/* Player hands */}
        {state.phase !== GamePhase.Welcome && state.phase !== GamePhase.Dealing && (
          <>
            <PlayerHand
              cards={state.hands[Position.North]}
              position={Position.North}
              onCardClick={state.revealedHand && state.bidder === Position.South && state.currentTurn === Position.North ? handleCardPlay : undefined}
              isCurrentTurn={state.currentTurn === Position.North}
              leadSuit={state.currentTrick.leadSuit}
              trumpSuit={state.trumpSuit}
              isRevealed={state.revealedHand && getPartner(state.bidder!) === Position.North}
            />
            
            <PlayerHand
              cards={state.hands[Position.East]}
              position={Position.East}
              onCardClick={state.revealedHand && state.bidder === Position.South && state.currentTurn === Position.East ? handleCardPlay : undefined}
              isCurrentTurn={state.currentTurn === Position.East}
              leadSuit={state.currentTrick.leadSuit}
              trumpSuit={state.trumpSuit}
              isRevealed={state.revealedHand && getPartner(state.bidder!) === Position.East}
            />
            
            <PlayerHand
              cards={state.hands[Position.South]}
              position={Position.South}
              onCardClick={handleCardPlay}
              isCurrentTurn={state.currentTurn === Position.South}
              leadSuit={state.currentTrick.leadSuit}
              trumpSuit={state.trumpSuit}
              isRevealed={true}
            />
            
            <PlayerHand
              cards={state.hands[Position.West]}
              position={Position.West}
              onCardClick={state.revealedHand && state.bidder === Position.South && state.currentTurn === Position.West ? handleCardPlay : undefined}
              isCurrentTurn={state.currentTurn === Position.West}
              leadSuit={state.currentTrick.leadSuit}
              trumpSuit={state.trumpSuit}
              isRevealed={state.revealedHand && getPartner(state.bidder!) === Position.West}
            />
          </>
        )}
        
        {/* Current trick */}
        {renderCurrentTrick()}
        
        {/* Turn indicator */}
        {renderTurnIndicator()}
        
        {/* Game info panel */}
        {renderGameInfo()}
        
        {/* Bids history */}
        {state.phase !== GamePhase.Welcome && state.phase !== GamePhase.Dealing && renderBidsHistory()}
        
        {/* Bidding panel */}
        {state.phase === GamePhase.Bidding && (
          <BiddingPanel
            onBid={handleBid}
            currentBid={state.currentBid}
            currentTurn={state.currentTurn}
            position={Position.South}
            bids={state.bids}
          />
        )}
        
        {/* Trump selector */}
        {state.phase === GamePhase.TrumpSelection && state.currentTurn === Position.South && (
          <TrumpSelector onSelectTrump={handleTrumpSelection} />
        )}
        
        {/* Round end overlay */}
        {renderRoundEnd()}
        
        {/* Welcome screen */}
        {renderWelcome()}
      </div>
    </div>
  );
};