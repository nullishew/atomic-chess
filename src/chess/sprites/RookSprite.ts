import { ChessPieceSprite } from "./ChessPieceSprite";
import { Game } from "../../scenes/Game";

export class RookSprite extends ChessPieceSprite {
  constructor(scene: Game, pos: Pos, color: ChessColor) {
    super(scene, [8, 9], color, pos);
  }
}