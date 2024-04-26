import { GameObjects, Tilemaps, Math } from "phaser";
import { Game } from "../../scenes/Game";
import { ASSETS } from "../../assets";
import { Pos, ChessColor } from "../AtomicChess";

// Base class to represent the GUI of each individual chess piece
export abstract class ChessPieceSprite extends GameObjects.Sprite {
  pos: Pos;
  tilemap: Tilemaps.Tilemap;
  particleEmitter: GameObjects.Particles.ParticleEmitter;

  // Sets the initial position of the chess piece and the image of the chess piece
  constructor(game: Game, frame: [number, number], color: ChessColor, pos: Pos) {
    const [r, c] = pos;
    const { x, y } = game.chessboardMap.tileToWorldXY(c, r) as Math.Vector2;
    super(game, x, y, ASSETS.CHESS_PIECES.key, frame[color]);
    this.pos = pos;
    this.setOrigin(0);
  }

  // Returns the game scene the chess piece is in
  get game() { return this.scene as Game }

  // Moves the chess piece
  move(pos: Pos) {
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
      cameras.main.shake(500, .005);
      explosionSound.play();
      this.setPosition(x, y);
      this.destroy();
    });
  }

}