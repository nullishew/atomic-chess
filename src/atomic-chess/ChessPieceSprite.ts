import { GameObjects, Scene } from "phaser";
import { ASSETS, PIECE_TO_TEXTURE_FRAME } from "../assets";
import { PromotablePiece } from "./AtomicChess";

// Class to represent a sprite to render chess pieces
export class ChessPiece extends GameObjects.Sprite {
  constructor(scene: Scene, textureFrame: number, x: number, y: number) {
    super(scene, x, y, ASSETS.CHESS_PIECES.key, textureFrame);
    this.setOrigin(0);
  }

  // Animates chess piece movement over the specified duration
  move(x: number, y: number, duration: number) {
    const tween = this.scene.tweens.add({ targets: this, x, y, ease: 'quad.in', duration });
    tween.on('complete', () => this.setPosition(x, y));
  }

  // Animates chess piece explosion (excluding particle effects, camera effects, sounds, etc.)
  explode() {
    this.destroy();
  }

  // Update the image of a promoting chess piece
  promote(piece: PromotablePiece) {
    this.setFrame(PIECE_TO_TEXTURE_FRAME[piece]);
  }
}
