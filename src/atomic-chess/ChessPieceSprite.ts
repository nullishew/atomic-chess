import { GameObjects, Scene } from "phaser";
import { ASSETS, PIECE_TO_TEXTURE_FRAME } from "../assets";
import { PromotablePiece } from "./atomicChess";

export class ChessPiece extends GameObjects.Sprite {
  constructor(scene: Scene, textureFrame: number, x: number, y: number) {
    super(scene, x, y, ASSETS.CHESS_PIECES.key, textureFrame);
    this.setOrigin(0);
  }

  // Moves a chess piece and explodes it if specified
  move(x: number, y: number, explode: boolean, duration: number) {
    // Create a tween to animate the piece movement
    const tween = this.scene.tweens.add({
      targets: this,
      x: x,
      y: y,
      ease: 'quad.in',
      duration: duration,
    });

    // When the tween completes, set the position of the piece and destroy it if explode is true
    tween.on('complete', () => {
      this.setPosition(x, y);
      if (!explode) return;
      this.destroy();
    });
  }

  // Update the image of a chess piece that gets promoted
  promote(piece: PromotablePiece) {
    this.setFrame(PIECE_TO_TEXTURE_FRAME[piece]);
  }
}
