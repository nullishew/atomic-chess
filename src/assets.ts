interface Asset {
  key: string,
  src: string,
};

// map asset names to asset key and asset src file
export const ASSETS: Record<string, Asset> = {
  CHESS_PIECES: { key: 'chess-pieces', src: 'pixel-chess-sprites.png' },
  CHESSBOARD_TILES: { key: 'chessboard-tiles', src: 'pixel-chess-tiles.png' },
  PARTICLE: { key: 'particle', src: 'particle.png' },
  EXPLOSION: { key: 'explosion', src: 'explosion.wav' },
  RETRY: {key: 'retry', src: 'retry.png'},
};
