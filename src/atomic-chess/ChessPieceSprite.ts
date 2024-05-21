import { GameObjects, Scene } from "phaser";
import { ASSETS, PIECE_TO_TEXTURE_FRAME } from "../assets";
import { PromotablePiece } from "./atomicChess";

// Class to represent a sprite to render chess pieces
export class ChessPiece extends GameObjects.Sprite {
  constructor(scene: Scene, textureFrame: number, x: number, y: number) {
    super(scene, x, y, ASSETS.CHESS_PIECES.key, textureFrame);
    this.setOrigin(0);
  }

  // Moves a chess piece and explodes it if specified
  move(x: number, y: number, duration: number) {
    // Create a tween to animate the piece movement
    const tween = this.scene.tweens.add({
      targets: this,
      x: x,
      y: y,
      ease: 'quad.in',
      duration: duration,
    });

    // When the tween completes, set the position of the piece
    tween.on('complete', () => this.setPosition(x, y));
  }

  explode() {
    this.destroy();
  }

  // Update the image of a chess piece that gets promoted
  promote(piece: PromotablePiece) {
    this.setFrame(PIECE_TO_TEXTURE_FRAME[piece]);
  }
}
