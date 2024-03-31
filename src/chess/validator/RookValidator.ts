import { PiecesEnum } from "../../enums";
import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

export class RookValidator extends ChessPieceValidator  {
  constructor(validator: AtomicChessValidator, color: ChessColor) {
    const dirs: Pos[] = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    super(validator, PiecesEnum.ROOK, color, dirs, dirs, 7);
  }
}