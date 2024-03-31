import { PiecesEnum } from "../../enums";
import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

export class KnightValidator extends ChessPieceValidator  {
  constructor(validator: AtomicChessValidator, color: ChessColor) {
    const dirs: Pos[] = [
      [1, 2],
      [2, 1],
      [2, -1],
      [1, -2],
      [-1, -2],
      [-2, -1],
      [-2, 1],
      [-1, 2],
    ];
    super(validator, PiecesEnum.KNIGHT, color, dirs, dirs, 1);
  }
}