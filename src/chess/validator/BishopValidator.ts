import { PiecesEnum } from "../../enums";
import { ChessColor, Pos } from "../AtomicChess";
import { ChessPieceValidator } from "./ChessPieceValidator";

// class to represent a validator to validate bishop moves
export class BishopValidator extends ChessPieceValidator {
  constructor(color: ChessColor) {
    const dirs: Pos[] = [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ];
    // a bishop can move and capture diagonally across the whole board
    super(PiecesEnum.BISHOP, color, dirs, dirs, 7);
  }
}