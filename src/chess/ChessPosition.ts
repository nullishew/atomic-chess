import { PiecesEnum } from "../enums";
import { ChessPositionArrayNotation, Pos, PieceNotation, ChessColor } from "./AtomicChess";

// Class representing a chess position
export class ChessPosition {
  #state: ChessPositionArrayNotation; // Private field to store the state of the chess position

  constructor(state: ChessPositionArrayNotation) {
    this.#state = state; // Initialize the state of the chess position
  }

  // Getter for retrieving the state of the chess position
  get state() { return this.#state.map(row => row.slice()) as ChessPositionArrayNotation }

  // Method to get the piece at a given position
  at([r, c]: Pos): PieceNotation | null {
    return this.#state?.[r]?.[c]; // Return the piece at the specified position
  }

  // Method to determine the color of the piece at a given position
  colorAt([r, c]: Pos): ChessColor | null {
    const piece = this.at([r, c]);
    if (!piece) return null;
    return piece.toUpperCase() == piece ? 0 : 1; // Return 0 for white, 1 for black
  }

  // Method to check if a given position is empty
  emptyAt(pos: Pos) {
    return this.has(pos) && !this.at(pos);
  }

  // Method to check if a position is within the board boundaries
  has([r, c]: Pos) {
    return 0 <= r && r < 8 && 0 <= c && c < 8;
  }

  // Method to find the position of the king of a given color
  indexOfKing(color: ChessColor): Pos | null {
    const piece = 'Kk'[color];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.#state[r][c] == piece) {
          return [r, c]; // Return the position of the king
        }
      }
    }
    return null; // King not found
  }

  // Method to check if two positions are adjacent
  isAdjacent(p1: Pos, p2: Pos) {
    if (!this.has(p1) || !this.has(p2)) return false;
    const [r1, c1] = p1;
    const [r2, c2] = p2;
    return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1; // Return true if positions are adjacent
  }

  // Method to get the type of piece at a given position
  typeAt([r, c]: Pos) {
    return this.#state?.[r]?.[c]?.toUpperCase() as PiecesEnum; // Return the type of piece
  }

  // Method to set a piece at a given position
  setAt([r, c]: Pos, piece: PieceNotation | null) {
    this.#state[r][c] = piece; // Set the piece at the specified position
  }

  // Method to capture a piece at a given position
  capture(from: Pos, to: Pos) {
    this.explode(to); // Remove the piece at the captured position
    this.explode(from); // Remove the piece from the capturing position
    this.explodeArea(to); // Remove surrounding pieces affected by the capture
  }

  // Method to perform kingside castling
  castleKingside(color: ChessColor) {
    const r = [7, 0][color];
    this.move([r, 4], [r, 6]); // Move the king
    this.move([r, 7], [r, 5]); // Move the rook
  }

  // Method to perform queenside castling
  castleQueenside(color: ChessColor) {
    const r = [7, 0][color];
    this.move([r, 4], [r, 2]); // Move the king
    this.move([r, 0], [r, 3]); // Move the rook
  }

  // Method to perform en passant capture
  enPassant(from: Pos, to: Pos) {
    const r1 = from[0];
    const c2 = to[1];
    this.explode([r1, c2]); // Remove the captured pawn
    this.explode(from); // Remove the pawn that performed en passant
    this.explodeArea(to); // Remove surrounding pieces affected by the capture
  }

  // Method to move a piece from one position to another
  move(from: Pos, to: Pos) {
    this.setAt(to, this.at(from)); // Move the piece to the new position
    this.setAt(from, null); // Remove the piece from the old position
  }

  // Method to remove a piece from a given position
  explode(pos: Pos) {
    this.setAt(pos, null); // Remove the piece from the specified position
  }

  // Method to remove surrounding pieces affected by a capture
  explodeArea([r, c]: Pos) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const pos: Pos = [r + dr, c + dc];
        if (!this.has(pos) || this.emptyAt(pos) || this.typeAt(pos) == PiecesEnum.PAWN) continue;
        this.explode(pos); // Remove the surrounding piece
      }
    }
  }
}
