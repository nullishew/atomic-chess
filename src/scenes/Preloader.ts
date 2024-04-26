import { Scene } from 'phaser';
import { ASSETS } from '../assets';
import { chessTileSize } from '../main';

// Scene to preload assets before loading the game
export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    const { config } = this.game;
    const width = Number(config.width);
    const height = Number(config.height);
    const halfWidth = .5 * width;
    const halfHeight = .5 * height;

    // Create a progress bar to show loading progress
    const barHeight = 16;
    this.add.rectangle(halfWidth, halfHeight, halfWidth, barHeight)
      .setStrokeStyle(2, 0xffffff);
    const bar = this.add.rectangle(halfWidth - .5 * halfWidth, halfHeight, 0, barHeight, 0xffffff);
    this.load.on('progress', (progress: number) => bar.width = halfWidth * progress);
  }

  // Load game assets
  preload() {
    this.load.setPath('assets');
    this.load.audio(ASSETS.EXPLOSION.key, ASSETS.EXPLOSION.src);
    this.load.image(ASSETS.CHESSBOARD_TILES.key, ASSETS.CHESSBOARD_TILES.src);
    this.load.image(ASSETS.PARTICLE.key, ASSETS.PARTICLE.src);
    this.load.image(ASSETS.RETRY.key, ASSETS.RETRY.src);
    this.load.spritesheet(ASSETS.CHESS_PIECES.key, ASSETS.CHESS_PIECES.src, { frameWidth: chessTileSize, frameHeight: chessTileSize });
  }

  // Switch the scene to the Game once the assets have been loaded
  create() {
    this.scene.start('Game');
  }
}
