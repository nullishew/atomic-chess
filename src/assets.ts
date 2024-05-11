import { Piece } from "./atomic-chess/atomicChess";

// Define structure of asset data to keep track of asset keys and src files
interface Asset {
  key: string,
  src: string,
};

// Map asset names to asset data
export const ASSETS: Record<string, Asset> = {
  CHESS_PIECES: { key: 'chess-pieces', src: 'pixel-chess-sprites.png' },
  CHESSBOARD_TILES: { key: 'chessboard-tiles', src: 'pixel-chess-tiles.png' },
  PARTICLE: { key: 'particle', src: 'particle.png' },
  EXPLOSION: { key: 'explosion', src: 'explosion.wav' },
  RETRY: {key: 'retry', src: 'retry.png'},
};

// Map pieces to their corresponding frame in the chess piece spritesheet
export const PIECE_TO_TEXTURE_FRAME: Record<Piece, number> = {
  k: 1,
  q: 3,
  b: 5,
  n: 7,
  r: 9,
  p: 11,
  K: 0,
  Q: 2,
  B: 4,
  N: 6,
  R: 8,
  P: 10
};