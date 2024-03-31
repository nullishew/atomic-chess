import { PiecesEnum } from "../../enums";
import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

export class BishopValidator extends ChessPieceValidator  {
  constructor(validator: AtomicChessValidator, color: ChessColor) {
    const dirs: Pos[] = [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ];
    super(validator, PiecesEnum.BISHOP, color, dirs, dirs, 7);
  }
}