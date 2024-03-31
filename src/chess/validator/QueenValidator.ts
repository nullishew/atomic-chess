import { PiecesEnum } from "../../enums";
import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

export class QueenValidator extends ChessPieceValidator  {
  constructor(validator: AtomicChessValidator, color: ChessColor) {
    const dirs: Pos[] = [
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
    ];
    super(validator, PiecesEnum.QUEEN, color, dirs, dirs, 7);
  }
}