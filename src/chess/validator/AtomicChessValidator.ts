import { ChessColor, FENData, Pos, equals } from "../AtomicChess";
import { ChessPosition } from "../ChessPosition";

export type Piece =
  'k' | 'q' | 'b' | 'n' | 'r' | 'p' |
  'K' | 'Q' | 'B' | 'N' | 'R' | 'P';

export enum MoveType {
  CAPTURE = 'c',
  DOUBLE = 'd',
  EN_PASSANT = 'e',
  KINGSIDE_CASTLE = 'k',
  PROMOTION = 'p',
  QUEENSIDE_CASTLE = 'q',
  STANDARD_MOVE = 's',
}

export enum PieceType {
  KING = 'K',
  QUEEN = 'Q',
  BISHOP = 'B',
  KNIGHT = 'N',
  ROOK = 'R',
  PAWN = 'P'
}

export interface MovePattern {
  steps: number,
  pattern: Pos[],
}

export const MOVE_PATTERNS: Record<string, Pos[]> = {
  ALL: [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ],
  DIAGONAL: [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ],
  HORIZONTAL: [
    [0, 1],
    [0, -1],
  ],
  L_SHAPE: [
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
    [-2, 1],
    [-1, 2],
  ],
  PLUS_SHAPE: [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ],
  VERTICAL: [
    [1, 0],
    [-1, 0],
  ],
};

export const PIECE_MOVE_PATTERNS: Record<Piece, MovePattern> = {
  K: { steps: 1, pattern: MOVE_PATTERNS.ALL },
  Q: { steps: 7, pattern: MOVE_PATTERNS.ALL },
  B: { steps: 7, pattern: MOVE_PATTERNS.DIAGONAL },
  N: { steps: 1, pattern: MOVE_PATTERNS.L_SHAPE },
  R: { steps: 7, pattern: MOVE_PATTERNS.PLUS_SHAPE },
  P: { steps: 1, pattern: [[-1, 0]] },
  k: { steps: 1, pattern: MOVE_PATTERNS.ALL },
  q: { steps: 7, pattern: MOVE_PATTERNS.ALL },
  b: { steps: 7, pattern: MOVE_PATTERNS.DIAGONAL },
  n: { steps: 1, pattern: MOVE_PATTERNS.L_SHAPE },
  r: { steps: 7, pattern: MOVE_PATTERNS.PLUS_SHAPE },
  p: { steps: 1, pattern: [[1, 0]] },
};

export const PIECE_CAPTURE_PATTERNS: Record<Piece, MovePattern> = {
  K: { steps: 0, pattern: MOVE_PATTERNS.ALL },
  Q: { steps: 7, pattern: MOVE_PATTERNS.ALL },
  B: { steps: 7, pattern: MOVE_PATTERNS.DIAGONAL },
  N: { steps: 1, pattern: MOVE_PATTERNS.L_SHAPE },
  R: { steps: 7, pattern: MOVE_PATTERNS.PLUS_SHAPE },
  P: { steps: 1, pattern: [[-1, -1], [-1, 1]] },
  k: { steps: 0, pattern: MOVE_PATTERNS.ALL },
  q: { steps: 7, pattern: MOVE_PATTERNS.ALL },
  b: { steps: 7, pattern: MOVE_PATTERNS.DIAGONAL },
  n: { steps: 1, pattern: MOVE_PATTERNS.L_SHAPE },
  r: { steps: 7, pattern: MOVE_PATTERNS.PLUS_SHAPE },
  p: { steps: 1, pattern: [[1, -1], [1, 1]] }
};

export function getValidMovesFrom(data: FENData, from: Pos): Pos[] {
  return [
    ...getValidCapturesFrom(data, from),
    ...getValidDoubleMovesFrom(data, from),
    ...getValidEnPassantsFrom(data, from),
    ...getValidKingsideCastlesFrom(data, from),
    ...getValidQueensideCastlesFrom(data, from),
    ...getValidStandardMovesFrom(data, from),
  ];
}

export function isPawnPromotion(data: FENData, from: Pos, to: Pos): boolean {
  const { position, activeColor } = data;
  const piece = position.at(from);
  const color = position.colorAt(from);
  const type = position.typeAt(from);
  if (!piece || type != PieceType.PAWN || color != activeColor) return false;
  const endRank = color == 0 ? 0 : 7;
  const r = to[0];
  return endRank == r;
}

export function isValidStandardMove(data: FENData, from: Pos, to: Pos): boolean {
  return getValidStandardMovesFrom(data, from).some(p => equals(to, p));
}

export function isValidCapture(data: FENData, from: Pos, to: Pos): boolean {
  return getValidCapturesFrom(data, from).some(p => equals(to, p));
}

export function isValidDoubleMove(data: FENData, from: Pos, to: Pos): boolean {
  return getValidDoubleMovesFrom(data, from).some(p => equals(to, p));
}

export function isValidEnPassant(data: FENData, from: Pos, to: Pos): boolean {
  return getValidEnPassantsFrom(data, from).some(p => equals(to, p));
}

export function isValidKingsideCastle(data: FENData, from: Pos, to: Pos): boolean {
  return getValidKingsideCastlesFrom(data, from).some(p => equals(to, p));
}

export function isValidQueensideCastle(data: FENData, from: Pos, to: Pos): boolean {
  return getValidQueensideCastlesFrom(data, from).some(p => equals(to, p));
}

export function isAtomicCheck(position: ChessPosition, color: ChessColor): boolean {
  const enemyColor = getEnemyColor(color);
  const kingPos = position.indexOfKing(color);
  const enemyKingPos = position.indexOfKing(enemyColor);
  if (!kingPos || !enemyKingPos) return false;
  if (position.isAdjacent(kingPos, enemyKingPos)) return false;
  const possiblePieces: Record<Piece, ChessColor> = {
    K: 0,
    Q: 0,
    B: 0,
    N: 0,
    R: 0,
    P: 0,
    k: 1,
    q: 1,
    b: 1,
    n: 1,
    r: 1,
    p: 1
  };
  const piecesToTypes: Record<Piece, PieceType> = {
    K: PieceType.KING,
    Q: PieceType.QUEEN,
    B: PieceType.BISHOP,
    N: PieceType.KNIGHT,
    R: PieceType.ROOK,
    P: PieceType.PAWN,
    k: PieceType.KING,
    q: PieceType.QUEEN,
    b: PieceType.BISHOP,
    n: PieceType.KNIGHT,
    r: PieceType.ROOK,
    p: PieceType.PAWN
  };
  for (let [type, pieceColor] of Object.entries(possiblePieces)) {
    if (color == pieceColor) continue;
    const [r, c] = kingPos;
    const { pattern, steps } = PIECE_CAPTURE_PATTERNS[type as Piece];
    for (let [dr, dc] of pattern) {
      for (let i = 1; i <= steps; i++) {
        const pos: Pos = [r - i * dr, c - i * dc];
        if (!position.has(pos)) break;
        if (position.emptyAt(pos)) continue;
        if (position.colorAt(pos) != enemyColor || position.typeAt(pos) != piecesToTypes[type as Piece]) break;
        return true;
      }
    }
  }
  return false;
}

export function getValidPlayerMoves(data: FENData, color: ChessColor): Pos[] {
  const { position } = data;
  return position.state.map((row, r) => row.map(
    (_, c) => [r, c] as Pos
  )).flat()
    .filter(p => position.colorAt(p) == color)
    .map(p => getValidMovesFrom(data, p))
    .flat();
}

export function existsValidPlayerMoves(data: FENData, color: ChessColor): boolean {
  return getValidPlayerMoves(data, color).length > 0;
}

export function isCheckMate(data: FENData, color: ChessColor): boolean {
  return isAtomicCheck(data.position, color) && !getValidPlayerMoves(data, color).length;
}

export function isStaleMate(data: FENData, color: ChessColor): boolean {
  return !isAtomicCheck(data.position, color) && !getValidPlayerMoves(data, color).length;
}

export function getEnemyColor(color: ChessColor): ChessColor {
  return color == 0 ? 1 : 0;
}

export const getSafeMoves = (data: FENData, color: ChessColor, from: Pos, tos: Pos[], moveType: MoveType) => tos.filter(to => isKingSafeAfterMove(data, color, from, to, moveType))

export function isKingSafeAfterMove(data: FENData, color: ChessColor, from: Pos, to: Pos, moveType: MoveType) {
  const newBoard = new ChessPosition(data.position.state);
  switch (moveType) {
    case MoveType.CAPTURE:
    case MoveType.EN_PASSANT:
      newBoard.capture(from, to);
      break;
    case MoveType.KINGSIDE_CASTLE:
      newBoard.castleKingside(color);
      break;
    case MoveType.QUEENSIDE_CASTLE:
      newBoard.castleQueenside(color);
      break;
    default:
      newBoard.move(from, to);
  }
  return newBoard.indexOfKing(color) && !isAtomicCheck(newBoard, color);
}

function getValidCapturesFrom(data: FENData, from: Pos): Pos[] {
  const { position, activeColor } = data;
  const piece = position.at(from);
  const color = position.colorAt(from);
  if (!piece || color != activeColor) return [];
  const enemyColor = getEnemyColor(activeColor);
  const [r, c] = from;
  const { pattern, steps } = PIECE_CAPTURE_PATTERNS[piece];
  const moves: Pos[] = [];
  for (let [dr, dc] of pattern) {
    for (let i = 1; i <= steps; i++) {
      const pos: Pos = [r + i * dr, c + i * dc];
      if (!position.has(pos)) break;
      if (position.emptyAt(pos)) continue;
      if (position.colorAt(pos) != enemyColor) break;
      moves.push(pos);
      break;
    }
  }
  return getSafeMoves(data, activeColor, from, moves, MoveType.CAPTURE);
}

function getValidStandardMovesFrom(data: FENData, from: Pos): Pos[] {
  const { position, activeColor } = data;
  const piece = position.at(from);
  const color = position.colorAt(from);
  if (!piece || color != activeColor) return [];
  const [r, c] = from;
  const { pattern, steps } = PIECE_MOVE_PATTERNS[piece];
  const moves: Pos[] = [];
  for (let [dr, dc] of pattern) {
    for (let i = 1; i <= steps; i++) {
      const pos: Pos = [r + i * dr, c + i * dc];
      if (!position.emptyAt(pos)) break;
      moves.push(pos);
    }
  }
  return getSafeMoves(data, activeColor, from, moves, MoveType.STANDARD_MOVE);
}

function getValidDoubleMovesFrom(data: FENData, from: Pos): Pos[] {
  const { position, activeColor } = data;
  const piece = position.at(from);
  const color = position.colorAt(from);
  const type = position.typeAt(from);
  if (!piece || type != PieceType.PAWN || color != activeColor) return [];
  const [r, c] = from;
  const startingRank = color == 0 ? 6 : 1;
  if (r != startingRank) return [];
  const { pattern } = PIECE_MOVE_PATTERNS[piece];
  const [dir] = pattern[0];
  if (!position.emptyAt([r + dir, c])) return [];
  return getSafeMoves(data, activeColor, from, [[r + 2 * dir, c]], MoveType.DOUBLE);
}

function getValidEnPassantsFrom(data: FENData, from: Pos): Pos[] {
  const { position, activeColor } = data;
  const piece = position.at(from);
  const color = position.colorAt(from);
  const type = position.typeAt(from);
  if (!piece || type != PieceType.PAWN || color != activeColor) return [];
  const [r, c] = from;
  const moves = PIECE_CAPTURE_PATTERNS[piece].pattern.filter(([dr, dc]) => data.enPassants.some(p => equals([r + dr, c + dc], p)));
  return getSafeMoves(data, activeColor, from, moves, MoveType.EN_PASSANT);
}

function getValidKingsideCastlesFrom(data: FENData, from: Pos): Pos[] {
  const { position, activeColor } = data;
  const piece = position.at(from);
  const color = position.colorAt(from);
  const type = position.typeAt(from);
  if (!piece || type != PieceType.KING || color != activeColor) return [];
  const backRank = color == 0 ? 7 : 0;
  const startingPos: Pos = [backRank, 4];
  if (!data.canCastle[color].kingside || !equals(from, startingPos) || isAtomicCheck(position, color)) return [];
  const positions: Pos[] = [
    [backRank, 5],
    [backRank, 6],
  ];
  if (!positions.every(p => position.emptyAt(p))) return [];
  return getSafeMoves(data, activeColor, from, [[backRank, 6]], MoveType.KINGSIDE_CASTLE);
}

function getValidQueensideCastlesFrom(data: FENData, from: Pos): Pos[] {
  const { position, activeColor } = data;
  const piece = position.at(from);
  const color = position.colorAt(from);
  const type = position.typeAt(from);
  if (!piece || type != PieceType.KING || color != activeColor) return [];
  const backRank = color == 0 ? 7 : 0;
  const startingPos: Pos = [backRank, 4];
  if (!data.canCastle[color].queenside || !equals(from, startingPos) || isAtomicCheck(position, color)) return [];
  const positions: Pos[] = [
    [backRank, 1],
    [backRank, 2],
    [backRank, 3],
  ];
  if (!positions.every(p => position.emptyAt(p))) return [];
  return getSafeMoves(data, activeColor, from, [[backRank, 2]], MoveType.QUEENSIDE_CASTLE);
}