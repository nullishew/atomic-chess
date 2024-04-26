import { PiecesEnum } from "../../enums";
import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

// class to represent a validator to validate bishop moves
export class BishopValidator extends ChessPieceValidator  {
  constructor(validator: AtomicChessValidator, color: ChessColor) {
    const dirs: Pos[] = [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ];
    // a bishop can move and capture diagonally across the whole board
    super(validator, PiecesEnum.BISHOP, color, dirs, dirs, 7);
  }
}