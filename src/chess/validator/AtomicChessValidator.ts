export type Pos = [number, number]
export enum Color {
  WHITE = 'white',
  BLACK = 'black',
}

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
export const PIECE_TO_COLOR: Record<Piece, Color> = {
  k: Color.BLACK,
  q: Color.BLACK,
  b: Color.BLACK,
  n: Color.BLACK,
  r: Color.BLACK,
  p: Color.BLACK,
  K: Color.WHITE,
  Q: Color.WHITE,
  B: Color.WHITE,
  N: Color.WHITE,
  R: Color.WHITE,
  P: Color.WHITE
};

export const PIECE_TO_TYPE: Record<Piece, PieceType> = {
  k: PieceType.KING,
  q: PieceType.QUEEN,
  b: PieceType.BISHOP,
  n: PieceType.KNIGHT,
  r: PieceType.ROOK,
  p: PieceType.PAWN,
  K: PieceType.KING,
  Q: PieceType.QUEEN,
  B: PieceType.BISHOP,
  N: PieceType.KNIGHT,
  R: PieceType.ROOK,
  P: PieceType.PAWN
};
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
  P: { steps: 1, pattern: [[1, 0]] },
  k: { steps: 1, pattern: MOVE_PATTERNS.ALL },
  q: { steps: 7, pattern: MOVE_PATTERNS.ALL },
  b: { steps: 7, pattern: MOVE_PATTERNS.DIAGONAL },
  n: { steps: 1, pattern: MOVE_PATTERNS.L_SHAPE },
  r: { steps: 7, pattern: MOVE_PATTERNS.PLUS_SHAPE },
  p: { steps: 1, pattern: [[-1, 0]] },
};

export const PIECE_CAPTURE_PATTERNS: Record<Piece, MovePattern> = {
  K: { steps: 0, pattern: MOVE_PATTERNS.ALL },
  Q: { steps: 7, pattern: MOVE_PATTERNS.ALL },
  B: { steps: 7, pattern: MOVE_PATTERNS.DIAGONAL },
  N: { steps: 1, pattern: MOVE_PATTERNS.L_SHAPE },
  R: { steps: 7, pattern: MOVE_PATTERNS.PLUS_SHAPE },
  P: { steps: 1, pattern: [[1, -1], [1, 1]] },
  k: { steps: 0, pattern: MOVE_PATTERNS.ALL },
  q: { steps: 7, pattern: MOVE_PATTERNS.ALL },
  b: { steps: 7, pattern: MOVE_PATTERNS.DIAGONAL },
  n: { steps: 1, pattern: MOVE_PATTERNS.L_SHAPE },
  r: { steps: 7, pattern: MOVE_PATTERNS.PLUS_SHAPE },
  p: { steps: 1, pattern: [[-1, -1], [-1, 1]] }
};

import * as chessboard from "./atomicChessboard";

export type CastlingRights = {
  white: { kingside: boolean, queenside: boolean },
  black: { kingside: boolean, queenside: boolean }
}
export type FEN = {
  board: chessboard.Chessboard,
  activeColor: Color,
  canCastle: CastlingRights,
  enPassantTargets: chessboard.Square[],
  halfMoves: number,
  fullMoves: number,
}
export interface MovePattern {
  steps: number,
  pattern: Pos[],
}

export function getValidMovesFrom(data: FEN, from: chessboard.Square): chessboard.Square[] {
  return [
    ...getValidCapturesFrom(data, from),
    ...getValidDoubleMovesFrom(data, from),
    ...getValidEnPassantsFrom(data, from),
    ...getValidKingsideCastlesFrom(data, from),
    ...getValidQueensideCastlesFrom(data, from),
    ...getValidStandardMovesFrom(data, from),
  ];
}

// rename to can promote pawn
export function canPromotePawn(board: chessboard.Chessboard, square: chessboard.Square): boolean {
  const piece = board[square];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN) return false;
  const endRank = PIECE_TO_COLOR[piece] == Color.WHITE ? '8' : '1';
  const r = square[1];
  return endRank == r;
}

export function isValidStandardMove(data: FEN, { from, to }: chessboard.Move): boolean {
  return getValidStandardMovesFrom(data, from).includes(to);
}

export function isValidCapture(data: FEN, { from, to }: chessboard.Move): boolean {
  return getValidCapturesFrom(data, from).includes(to);
}

export function isValidDoubleMove(data: FEN, { from, to }: chessboard.Move): boolean {
  return getValidDoubleMovesFrom(data, from).includes(to);
}

export function isValidEnPassant(data: FEN, { from, to }: chessboard.Move): boolean {
  return getValidEnPassantsFrom(data, from).includes(to);
}

export function isValidKingsideCastle(data: FEN, { from, to }: chessboard.Move): boolean {
  return getValidKingsideCastlesFrom(data, from).includes(to);
}

export function isValidQueensideCastle(data: FEN, { from, to }: chessboard.Move): boolean {
  return getValidQueensideCastlesFrom(data, from).includes(to);
}

export function isAtomicCheck(board: chessboard.Chessboard, activeColor: Color): boolean {
  const enemyColor = getEnemyColor(activeColor);
  const kingPos = chessboard.findKing(board, activeColor);
  const enemyKingPos = chessboard.findKing(board, enemyColor);
  if (!kingPos || !enemyKingPos) return false;
  if (chessboard.isAdjacent(kingPos, enemyKingPos)) return false;
  for (let [piece, color] of Object.entries(PIECE_TO_COLOR) as [Piece, Color][]) {
    if (activeColor == color) continue;
    const [r, c] = chessboard.SQUARE_TO_INDEX[kingPos];
    const { pattern, steps } = PIECE_CAPTURE_PATTERNS[piece];
    for (let [dr, dc] of pattern) {
      for (let i = 1; i <= steps; i++) {
        const square = chessboard.getSquareAtPos([r - i * dr, c - i * dc]);
        if (!square) break;
        const piece2 = board[square];
        if (!piece2) continue;
        if (PIECE_TO_COLOR[piece2] != enemyColor || PIECE_TO_TYPE[piece2] != PIECE_TO_TYPE[piece]) break;
        return true;
      }
    }
  }
  return false;
}

export function getValidPlayerMoves(data: FEN): chessboard.Move[] {
  const { board } = data;
  return (Object.keys(board) as chessboard.Square[])
    .map(square => getValidMovesFrom(data, square).map(to => ({ from: square, to: to })))
    .flat();
}

export function existsValidPlayerMoves(data: FEN): boolean {
  return getValidPlayerMoves(data).length > 0;
}

export function isCheckMate(data: FEN): boolean {
  const { board, activeColor } = data;
  return isAtomicCheck(board, activeColor) && !getValidPlayerMoves(data).length;
}

export function isStaleMate(data: FEN, activeColor: Color): boolean {
  return !isAtomicCheck(data.board, activeColor) && !getValidPlayerMoves(data).length && chessboard.findKing(data.board, activeColor) != null;
}

export function getEnemyColor(color: Color): Color {
  return color == Color.WHITE ? Color.BLACK : Color.WHITE;
}

export function getSafeMoves(board: chessboard.Chessboard, activeColor: Color, from: chessboard.Square, tos: chessboard.Square[], moveType: MoveType): chessboard.Square[] {
  return tos.filter(to => isKingSafeAfterMove(board, activeColor, { from: from, to: to }, moveType));
}

export function isKingSafeAfterMove(board: chessboard.Chessboard, activeColor: Color, move: chessboard.Move, moveType: MoveType) {
  let result: chessboard.Chessboard;
  switch (moveType) {
    case MoveType.CAPTURE:
      ({ result } = chessboard.capture(board, move));
      break;
    case MoveType.EN_PASSANT:
      ({ result } = chessboard.enPassant(board, move));
      break;
    case MoveType.KINGSIDE_CASTLE:
      ({ result } = chessboard.castleKingside(board, activeColor));
      break;
    case MoveType.QUEENSIDE_CASTLE:
      ({ result } = chessboard.castleQueenside(board, activeColor));
      break;
    default:
      ({ result } = chessboard.standardMove(board, move));
  }
  return chessboard.findKing(result, activeColor) && !isAtomicCheck(result, activeColor);
}

function getValidCapturesFrom(data: FEN, from: chessboard.Square): chessboard.Square[] {
  const { board, activeColor } = data;
  const piece = board[from];
  if (!piece || PIECE_TO_COLOR[piece] != activeColor) return [];
  const enemyColor = getEnemyColor(activeColor);
  const [r, c] = chessboard.SQUARE_TO_INDEX[from];
  const { pattern, steps } = PIECE_CAPTURE_PATTERNS[piece];
  const moves: chessboard.Square[] = [];
  for (let [dr, dc] of pattern) {
    for (let i = 1; i <= steps; i++) {
      const to = chessboard.getSquareAtPos([r + i * dr, c + i * dc]);
      if (!to) break;
      const piece2 = board[to];
      if (!piece2) continue;
      if (PIECE_TO_COLOR[piece2] != enemyColor) break;
      moves.push(to);
      break;
    }
  }
  return getSafeMoves(board, activeColor, from, moves, MoveType.CAPTURE);
}

function getValidStandardMovesFrom(data: FEN, from: chessboard.Square): chessboard.Square[] {
  const { board, activeColor } = data;
  const piece = board[from];
  if (!piece || PIECE_TO_COLOR[piece] != activeColor) return [];
  const [r, c] = chessboard.SQUARE_TO_INDEX[from];
  const { pattern, steps } = PIECE_MOVE_PATTERNS[piece];
  const moves: chessboard.Square[] = [];
  for (let [dr, dc] of pattern) {
    for (let i = 1; i <= steps; i++) {
      const square = chessboard.getSquareAtPos([r + i * dr, c + i * dc]);
      if (!square || board[square]) break;
      moves.push(square);
    }
  }
  return getSafeMoves(board, activeColor, from, moves, MoveType.STANDARD_MOVE);
}

function getValidDoubleMovesFrom(data: FEN, from: chessboard.Square): chessboard.Square[] {
  const { board, activeColor } = data;
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN || PIECE_TO_COLOR[piece] != activeColor) return [];
  const [r, c] = chessboard.SQUARE_TO_INDEX[from];
  const startingRank = activeColor == Color.WHITE ? 1 : 6;
  if (r != startingRank) return [];
  const { pattern } = PIECE_MOVE_PATTERNS[piece];
  const [dir] = pattern[0];
  const square1 = chessboard.getSquareAtPos([r + dir, c]);
  if (!square1 || board[square1]) return [];
  const to = chessboard.getSquareAtPos([r + 2 * dir, c]);
  if (!to) return [];
  return getSafeMoves(board, activeColor, from, [to], MoveType.DOUBLE);
}

function getValidEnPassantsFrom(data: FEN, from: chessboard.Square): chessboard.Square[] {
  const { board, activeColor, enPassantTargets } = data;
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN || PIECE_TO_COLOR[piece] != activeColor) return [];
  const [r, c] = chessboard.SQUARE_TO_INDEX[from];
  const moves = PIECE_CAPTURE_PATTERNS[piece].pattern.map(([dr, dc]) => chessboard.getSquareAtPos([r + dr, c + dc]))
    .filter(square => square && enPassantTargets.includes(square)) as chessboard.Square[];
  return getSafeMoves(board, activeColor, from, moves, MoveType.EN_PASSANT);
}

function getValidKingsideCastlesFrom(data: FEN, from: chessboard.Square): chessboard.Square[] {
  const { board, activeColor, canCastle } = data;
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.KING || PIECE_TO_COLOR[piece] != activeColor) return [];
  const { king, between } = chessboard.castlingMoves[activeColor].kingside;
  if (!canCastle[activeColor].kingside || from != king.from || isAtomicCheck(board, activeColor)) return [];
  if (between.some(square => board[square])) return [];
  return getSafeMoves(board, activeColor, from, [king.to], MoveType.KINGSIDE_CASTLE);
}

function getValidQueensideCastlesFrom(data: FEN, from: chessboard.Square): chessboard.Square[] {
  const { board, activeColor, canCastle } = data;
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.KING || PIECE_TO_COLOR[piece] != activeColor) return [];
  const { king, between } = chessboard.castlingMoves[activeColor].queenside;
  if (!canCastle[activeColor].queenside || from != king.from || isAtomicCheck(board, activeColor)) return [];
  if (between.some(square => board[square])) return [];
  return getSafeMoves(board, activeColor, from, [king.to], MoveType.KINGSIDE_CASTLE);
}