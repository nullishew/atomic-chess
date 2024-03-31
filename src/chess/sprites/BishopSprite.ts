import { ChessPieceSprite } from "./ChessPieceSprite";
import { Game } from "../../scenes/Game";

export class BishopSprite extends ChessPieceSprite {
  constructor(scene: Game, pos: Pos, color: ChessColor) {
    super(scene, [4, 5], color, pos);
  }
}