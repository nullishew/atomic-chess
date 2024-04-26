import { Game as MainGame } from './scenes/Game';
import { Preloader } from './scenes/Preloader';
import { Game, Types } from "phaser";

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 256,
  height: 192,
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

export const chessTileSize = 16;