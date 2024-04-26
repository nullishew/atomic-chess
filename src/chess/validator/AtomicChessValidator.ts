import { ChessColor, FENData, PieceNotation, Pos, equals } from "../AtomicChess";
import { ChessPosition } from "../ChessPosition";
import { BishopValidator } from "./BishopValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";
import { KingValidator } from "./KingValidator";
import { KnightValidator } from "./KnightValidator";
import { PawnValidator } from "./PawnValidator";
import { QueenValidator } from "./QueenValidator";
import { RookValidator } from "./RookValidator";

// A dictionary mapping piece notations to their respective validators
const pieceValidators: Record<PieceNotation, ChessPieceValidator> = {
  'K': new KingValidator(0),  // King for white pieces
  'Q': new QueenValidator(0), // Queen for white pieces
  'B': new BishopValidator(0), // Bishop for white pieces
  'N': new KnightValidator(0), // Knight for white pieces
  'R': new RookValidator(0), // Rook for white pieces
  'P': new PawnValidator(0), // Pawn for white pieces
  'k': new KingValidator(1), // King for black pieces
  'q': new QueenValidator(1), // Queen for black pieces
  'b': new BishopValidator(1), // Bishop for black pieces
  'n': new KnightValidator(1), // Knight for black pieces
  'r': new RookValidator(1), // Rook for black pieces
  'p': new PawnValidator(1), // Pawn for black pieces
};

// Checks if a piece at the given position exists and matches the current player color
function canMovePiece(data: FENData, from: Pos) {
  const { position, activeColor } = data;
  return position.colorAt(from) == activeColor;
}

// Returns the corresponding validator for the piece at the given position
function getValidatorAt(data: FENData, from: Pos): ChessPieceValidator | null {
  const piece = data.position.at(from);
  return piece ? pieceValidators[piece] : null;
}

// Returns an array of valid moves from a given position
export function getValidMovesFrom(data: FENData, from: Pos): Pos[] {
  if (!canMovePiece(data, from)) return [];
  return getValidatorAt(data, from)?.getValidMovesFrom(data, from) ?? [];
}

// Checks if a pawn is promoting
export function isPawnPromotion(data: FENData, from: Pos, to: Pos): boolean {
  const { position, activeColor } = data;
  const piece = position.at(from);
  if (!piece) return false; // If there's no piece at the given position, return false
  const color = position.colorAt(from);
  if (color != activeColor) return false; // If the piece color doesn't match the active color, return false
  const validator = pieceValidators[piece];
  if (!(validator instanceof PawnValidator)) return false; // If the piece is not a pawn, return false
  const r = to[0];
  return [0, 7][color] == r; // Check if the pawn reaches the last rank
}

// Checks if a standard move is valid
export function isValidStandardMove(data: FENData, from: Pos, to: Pos): boolean {
  if (!canMovePiece(data, from)) return false;
  const validator = getValidatorAt(data, from);
  if (!validator) return false;
  return validator.getValidStandardMovesFrom(data, from)
    .some(p => equals(p, to));
}

// Checks if a capture move is valid
export function isValidCapture(data: FENData, from: Pos, to: Pos): boolean {
  if (!canMovePiece(data, from)) return false;
  const validator = getValidatorAt(data, from);
  if (!validator) return false;
  return validator.getValidCapturesFrom(data, from)
    .some(p => equals(p, to));
}

// Checks if a double move (for pawn) is valid
export function isValidDoubleMove(data: FENData, from: Pos, to: Pos): boolean {
  if (!canMovePiece(data, from)) return false;
  const validator = getValidatorAt(data, from);
  if (!(validator instanceof PawnValidator)) return false;
  return validator.getValidDoubleMovesFrom(data, from)
    .some(p => equals(p, to));
}

// Checks if an en passant move is valid
export function isValidEnPassant(data: FENData, from: Pos, to: Pos): boolean {
  if (!canMovePiece(data, from)) return false;
  const validator = getValidatorAt(data, from);
  if (!(validator instanceof PawnValidator)) return false;
  return validator.getValidEnPassantsFrom(data, from)
    .some(p => equals(p, to));
}

// Checks if a kingside castle move is valid
export function isValidKingsideCastle(data: FENData, from: Pos, to: Pos): boolean {
  if (!canMovePiece(data, from)) return false;
  const validator = getValidatorAt(data, from);
  if (!(validator instanceof KingValidator)) return false;
  return validator.getValidKingsideCastlesFrom(data, from)
    .some(p => equals(p, to));
}

// Checks if a queenside castle move is valid
export function isValidQueensideCastle(data: FENData, from: Pos, to: Pos): boolean {
  if (!canMovePiece(data, from)) return false;
  const validator = getValidatorAt(data, from);
  if (!(validator instanceof KingValidator)) return false;
  return validator.getValidQueensideCastleFrom(data, from)
    .some(p => equals(p, to));
}

// Checks if a position results in atomic check
export function isAtomicCheck(position: ChessPosition, color: ChessColor): boolean {
  const enemyColor = getEnemyColor(color);
  const kingPos = position.indexOfKing(color);
  const enemyKingPos = position.indexOfKing(enemyColor);
  if (!kingPos || !enemyKingPos) return false; // If king positions are not found, return false
  if (position.isAdjacent(kingPos, enemyKingPos)) return false; // If kings are adjacent, return false
  const validators = Object.values(pieceValidators).filter(validator => validator.color != color);
  for (let { captureDirs, maxMoveSteps, type } of validators) {
    const [r, c] = kingPos;
    for (let [dr, dc] of captureDirs) {
      for (let i = 1; i <= maxMoveSteps; i++) {
        const pos: Pos = [r - i * dr, c - i * dc];
        if (!position.has(pos)) break;
        if (position.emptyAt(pos)) continue;
        if (position.colorAt(pos) != enemyColor || position.typeAt(pos) != type) break;
        return true; // If a piece threatens the king, return true
      }
    }
  }
  return false; // If no piece threatens the king, return false
}

// Returns an array of valid moves for a player
export function getValidPlayerMoves(data: FENData, color: ChessColor): Pos[] {
  const { position } = data;
  return position.state.map((row, r) => row.map(
    (_, c) => [r, c] as Pos
  )).flat()
    .filter(p => position.colorAt(p) == color)
    .map(p => getValidMovesFrom(data, p))
    .flat();
}

// Checks if valid moves exist for a player
export function existsValidPlayerMoves(data: FENData, color: ChessColor): boolean {
  return getValidPlayerMoves(data, color).length > 0;
}

// Checks if the current state leads to checkmate for a player
export function isCheckMate(data: FENData, color: ChessColor): boolean {
  return isAtomicCheck(data.position, color) && !getValidPlayerMoves(data, color).length;
}

// Checks if the current state leads to stalemate for a player
export function isStaleMate(data: FENData, color: ChessColor): boolean {
  return !isAtomicCheck(data.position, color) && !getValidPlayerMoves(data, color).length;
}

// Returns the enemy color given a color
export function getEnemyColor(color: ChessColor): ChessColor {
  return color == 0 ? 1 : 0;
}
