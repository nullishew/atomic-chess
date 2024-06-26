import { Game as MainGame } from './scenes/Game';
import { Preloader } from './scenes/Preloader';
import { Game, Types } from "phaser";

// Configure game window properties
const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 160,
  height: 160,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: true,
  scene: [
    Preloader,
    MainGame,
  ]
};

export default new Game(config);

export const chessTileSize = 16; // Define the size of each tile on the chessboard