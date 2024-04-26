import { ChessPieceSprite } from "./ChessPieceSprite";
import { Game } from "../../scenes/Game";

// Class representing the GUI for a queen
export class QueenSprite extends ChessPieceSprite {
  constructor(scene: Game, pos: Pos, color: ChessColor) {
    super(scene, [2, 3], color, pos);
  }
}