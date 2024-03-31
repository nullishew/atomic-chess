import { ChessPieceSprite } from "./ChessPieceSprite";
import { Game } from "../../scenes/Game";

export class KnightSprite extends ChessPieceSprite {
  constructor(scene: Game, pos: Pos, color: ChessColor) {
    super(scene, [6, 7], color, pos);
  }
}