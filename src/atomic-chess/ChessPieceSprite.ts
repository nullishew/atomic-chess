import { GameObjects } from "phaser";
import { ASSETS } from "../assets";
import { Square, squareToWorldXY } from "./atomicChess";
import { AtomicChessGUI } from "./AtomicChessGUI";

export class ChessPiece extends GameObjects.Sprite {
  square: Square;
  gui: AtomicChessGUI;

  constructor(gui: AtomicChessGUI, frame: number, square: Square) {
    const {x, y} = squareToWorldXY(square, gui.chessboardTilemap);
    super(gui.scene, x, y, ASSETS.CHESS_PIECES.key, frame);
    this.square = square;
    this.setOrigin(0);
    this.gui = gui;
  }

  move(square: Square) {
    this.square = square;
    const {x, y} = squareToWorldXY(square, this.gui.chessboardTilemap);
    const tween = this.gui.scene.tweens.add({
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
    const {x, y} = squareToWorldXY(this.square, this.gui.chessboardTilemap);
    const tween = this.gui.scene.tweens.add({
      targets: this,
      x: x,
      y: y,
      ease: 'quad.in',
      duration: 100,
    });
    tween.on('complete', () => {
      const { explosionParticles, camera, explosionSound } = this.gui;
      explosionParticles.explode(50, this.x, this.y);
      camera.shake(500, .01);
      explosionSound.play();
      this.setPosition(x, y);
      this.destroy();
    });
  }

}