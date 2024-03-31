interface Asset {
  key: string,
  src: string,
};

export const ASSETS: Record<string, Asset> = {
  CHESS_PIECES: { key: 'chess-pieces', src: 'pixel-chess-sprites.png' },
  CHESSBOARD_TILES: { key: 'chessboard-tiles', src: 'pixel-chess-tiles.png' },
  GAMEOVER_MENU: { key: 'game-over-menu', src: 'game-over-menu.html' },
  PARTICLE: { key: 'particle', src: 'particle.png' },
  EXPLOSION: { key: 'explosion', src: 'explosion.wav' },
  RETRY: {key: 'retry', src: 'retry.png'},
};
