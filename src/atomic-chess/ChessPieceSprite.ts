import { GameObjects } from "phaser";
import { ASSETS, PIECE_TO_TEXTURE_FRAME } from "../assets";
import { PromotablePiece, Square, squareToWorldXY } from "./atomicChess";
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
      this.gui.explode(x, y);
      this.setPosition(x, y);
      this.destroy();
    });
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

  promote(piece: PromotablePiece) {
    this.setFrame(PIECE_TO_TEXTURE_FRAME[piece]);
  }

  

}