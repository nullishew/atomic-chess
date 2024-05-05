import { GameObjects, Tilemaps, Math } from "phaser";
import { ASSETS } from "../assets";
import { Game, getTileIndexAtSquareIndex } from "../scenes/Game";
import { Pos } from "../chess/validator/atomicChessValidator";
import { SQUARE_TO_INDEX, Square } from "../chess/validator/atomicChessboard";

// Base class to represent the GUI of each individual chess piece
export class ChessPieceSprite extends GameObjects.Sprite {
  pos: Pos;
  tilemap: Tilemaps.Tilemap;
  particleEmitter: GameObjects.Particles.ParticleEmitter;
  game: Game;

  // Sets the initial position of the chess piece and the image of the chess piece
  constructor(game: Game, frame: number, pos: Pos) {
    const [r, c] = pos;
    const { x, y } = game.chessboardMap.tileToWorldXY(c, r) as Math.Vector2;
    super(game, x, y, ASSETS.CHESS_PIECES.key, frame);
    this.pos = pos;
    this.setOrigin(0);
    this.game = game;
  }

  // Moves the chess piece
  move(square: Square) {
    const pos = getTileIndexAtSquareIndex(SQUARE_TO_INDEX[square]);
    this.pos = pos;
    const [r, c] = pos;
    const { x, y } = this.game.chessboardMap.tileToWorldXY(c, r) as Math.Vector2;
    const tween = this.game.tweens.add({
      targets: this,
      x: x,
      y: y,
      ease: 'quad.in',
      duration: 100,
    });
    tween.on('complete', () => {
      this.setPosition(x, y);
    });
  }

  // Explodes the chess piece
  explode() {
    const [r, c] = this.pos;
    const { x, y } = this.game.chessboardMap.tileToWorldXY(c, r) as Math.Vector2;
    const tween = this.game.tweens.add({
      targets: this,
      x: x,
      y: y,
      ease: 'quad.in',
      duration: 100,
    });
    tween.on('complete', () => {
      const { explosionParticles, cameras, explosionSound } = this.game;
      explosionParticles.explode(50, this.x, this.y);
      cameras.main.shake(500, .01);
      explosionSound.play();
      this.setPosition(x, y);
      this.destroy();
    });
  }

}