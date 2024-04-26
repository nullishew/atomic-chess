import { PiecesEnum } from "../../enums";
import { ChessColor, Pos } from "../AtomicChess";
import { ChessPieceValidator } from "./ChessPieceValidator";

// class to represent a validator to validate queen moves
export class QueenValidator extends ChessPieceValidator {
  constructor(color: ChessColor) {
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
    // a queen can move and capture in any direction across the whole board
    super(PiecesEnum.QUEEN, color, dirs, dirs, 7);
  }
}