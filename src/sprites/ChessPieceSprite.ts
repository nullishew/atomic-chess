import { GameObjects } from "phaser";
import { ASSETS } from "../assets";
import { Game } from "../scenes/Game";
import { Square, squareToWorldXY } from "../chess/atomicChessData";

export class ChessPiece extends GameObjects.Sprite {
  square: Square;
  game: Game;

  constructor(game: Game, frame: number, square: Square) {
    const {x, y} = squareToWorldXY(square, game.chessboardTilemap);
    super(game, x, y, ASSETS.CHESS_PIECES.key, frame);
    this.square = square;
    this.setOrigin(0);
    this.game = game;
  }

  move(square: Square) {
    this.square = square;
    const {x, y} = squareToWorldXY(square, this.game.chessboardTilemap);
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

  explode() {
    const {x, y} = squareToWorldXY(this.square, this.game.chessboardTilemap);
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