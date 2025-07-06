
import React from 'react';
import { Position } from '../../types/game';

interface BiddingPanelProps {
  onBid: (value: number | null) => void;
  currentBid: number | null;
  currentTurn: Position;
  position: Position;
  bids: Array<{ position: Position; value: number | null }>;
}

export const BiddingPanel: React.FC<BiddingPanelProps> = ({
  onBid,
  currentBid,
  currentTurn,
  position,
  bids
}) => {
  const isPlayerTurn = currentTurn === position;
  const hasPlayerBid = bids.some(bid => bid.position === position);
  
  if (!isPlayerTurn || hasPlayerBid) {
    return null;
  }
  
  const possibleBids = [8, 9, 10, 11, 12, 13];
  const validBids = possibleBids.filter(bid => currentBid === null || bid > currentBid);
  
  return (
    <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 bg-white/90 p-4 rounded-lg shadow-lg border-2 border-red-800 z-50 w-80">
      <h3 className="text-center text-xl font-bold mb-4 text-red-900">Your Bid</h3>
      
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {validBids.map(bid => (
          <button
            key={bid}
            onClick={() => onBid(bid)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-red-700 to-red-900 text-white font-bold text-xl hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all"
          >
            {bid}
          </button>
        ))}
      </div>
      
      <button
        onClick={() => onBid(null)}
        className="w-full py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-all"
      >
        Pass
      </button>
    </div>
  );
};