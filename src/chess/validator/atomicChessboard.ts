import { Color, PIECE_TO_TYPE, Piece, PieceType, Pos } from "./atomicChessValidator";

export type CastlingRights = {
  white: { kingside: boolean, queenside: boolean },
  black: { kingside: boolean, queenside: boolean }
}
export type FEN = {
  board: Chessboard,
  activeColor: Color,
  canCastle: CastlingRights,
  enPassantTargets: Square[],
  halfMoves: number,
  fullMoves: number,
}

export type Square =
  'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8' |
  'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7' |
  'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6' |
  'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5' |
  'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4' |
  'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3' |
  'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2' |
  'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1';

export type SquareIndex =
  [0, 0] | [0, 1] | [0, 2] | [0, 3] | [0, 4] | [0, 5] | [0, 6] | [0, 7] |
  [1, 0] | [1, 1] | [1, 2] | [1, 3] | [1, 4] | [1, 5] | [1, 6] | [1, 7] |
  [2, 0] | [2, 1] | [2, 2] | [2, 3] | [2, 4] | [2, 5] | [2, 6] | [2, 7] |
  [3, 0] | [3, 1] | [3, 2] | [3, 3] | [3, 4] | [3, 5] | [3, 6] | [3, 7] |
  [4, 0] | [4, 1] | [4, 2] | [4, 3] | [4, 4] | [4, 5] | [4, 6] | [4, 7] |
  [5, 0] | [5, 1] | [5, 2] | [5, 3] | [5, 4] | [5, 5] | [5, 6] | [5, 7] |
  [6, 0] | [6, 1] | [6, 2] | [6, 3] | [6, 4] | [6, 5] | [6, 6] | [6, 7] |
  [7, 0] | [7, 1] | [7, 2] | [7, 3] | [7, 4] | [7, 5] | [7, 6] | [7, 7];

export const FILES = 'abcdefgh';
export const RANKS = '12345678';
export const SQUARE_TO_INDEX: Record<Square, SquareIndex> = {
  a8: [7, 0], b8: [7, 1], c8: [7, 2], d8: [7, 3], e8: [7, 4], f8: [7, 5], g8: [7, 6], h8: [7, 7],
  a7: [6, 0], b7: [6, 1], c7: [6, 2], d7: [6, 3], e7: [6, 4], f7: [6, 5], g7: [6, 6], h7: [6, 7],
  a6: [5, 0], b6: [5, 1], c6: [5, 2], d6: [5, 3], e6: [5, 4], f6: [5, 5], g6: [5, 6], h6: [5, 7],
  a5: [4, 0], b5: [4, 1], c5: [4, 2], d5: [4, 3], e5: [4, 4], f5: [4, 5], g5: [4, 6], h5: [4, 7],
  a4: [3, 0], b4: [3, 1], c4: [3, 2], d4: [3, 3], e4: [3, 4], f4: [3, 5], g4: [3, 6], h4: [3, 7],
  a3: [2, 0], b3: [2, 1], c3: [2, 2], d3: [2, 3], e3: [2, 4], f3: [2, 5], g3: [2, 6], h3: [2, 7],
  a2: [1, 0], b2: [1, 1], c2: [1, 2], d2: [1, 3], e2: [1, 4], f2: [1, 5], g2: [1, 6], h2: [1, 7],
  a1: [0, 0], b1: [0, 1], c1: [0, 2], d1: [0, 3], e1: [0, 4], f1: [0, 5], g1: [0, 6], h1: [0, 7],
};

export function getSquareAtPos([r, f]: Pos): Square | null {
  if (r < 0 || r > 7 || f < 0 || f > 7) return null;
  return FILES[f] + RANKS[r] as Square;
}

export function getSquareAtIndex([r, f]: SquareIndex): Square {
  return FILES[f] + RANKS[r] as Square;
}

export function moveSquare(square: Square, [dr, dc]: Pos): Square | null {
  const [r, c] = SQUARE_TO_INDEX[square];
  return getSquareAtPos([r + dr, c + dc]);
}

export type Chessboard = Record<Square, Piece | null>;
export const CHESSBOARD_SETUP: Record<Square, Piece | null> = {
  a8: 'r', b8: 'n', c8: 'b', d8: 'q', e8: 'k', f8: 'b', g8: 'n', h8: 'r',
  a7: 'p', b7: 'p', c7: 'p', d7: 'p', e7: 'p', f7: 'p', g7: 'p', h7: 'p',
  a6: null, b6: null, c6: null, d6: null, e6: null, f6: null, g6: null, h6: null,
  a5: null, b5: null, c5: null, d5: null, e5: null, f5: null, g5: null, h5: null,
  a4: null, b4: null, c4: null, d4: null, e4: null, f4: null, g4: null, h4: null,
  a3: null, b3: null, c3: null, d3: null, e3: null, f3: null, g3: null, h3: null,
  a2: 'P', b2: 'P', c2: 'P', d2: 'P', e2: 'P', f2: 'P', g2: 'P', h2: 'P',
  a1: 'R', b1: 'N', c1: 'B', d1: 'Q', e1: 'K', f1: 'B', g1: 'N', h1: 'R',
};
export interface Move {
  from: Square,
  to: Square,
}

export interface ChessActionLog {
  moves: Move[],
  explosions: Square[],
  result: Chessboard,
}

export function findPiece(board: Chessboard, piece: Piece): Square | null {
  return (Object.keys(board) as Square[]).find(key => board[key] == piece) ?? null;
}

export function findKing(board: Chessboard, activeColor: Color): Square | null {
  return findPiece(board, activeColor == Color.WHITE ? 'K' : 'k');
}

export function isAdjacent(square1: Square, square2: Square) {
  const [r1, c1] = SQUARE_TO_INDEX[square1];
  const [r2, c2] = SQUARE_TO_INDEX[square2];
  return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
}

function movePiece(board: Chessboard, move: Move) {
  const { from, to } = move;
  board[to] = board[from];
  board[from] = null;
}

function explodeSquare(board: Chessboard, square: Square) {
  board[square] = null;
}

function explodeArea(board: Chessboard, square: Square) {
  explodeSquare(board, square);
  const [r, c] = SQUARE_TO_INDEX[square];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const adjSquare = getSquareAtPos([r + dr, c + dc]);
      if (!adjSquare) continue;
      const piece = board[adjSquare];
      if (!piece || PIECE_TO_TYPE[piece] == PieceType.PAWN) continue;
      explodeSquare(board, adjSquare);
    }
  }
}

// returns surrounding explodable squares
function getSurroundingExplosions(board: Chessboard, square: Square): Square[] {
  let explosions: Square[] = [];
  const [r, c] = SQUARE_TO_INDEX[square];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const adjSquare = getSquareAtPos([r + dr, c + dc]);
      if (!adjSquare) continue;
      const piece = board[adjSquare];
      if (!piece || PIECE_TO_TYPE[piece] == PieceType.PAWN) continue;
      explosions.push(adjSquare);
    }
  }
  return explosions;
}

export function standardMove(board: Chessboard, move: Move): ChessActionLog {
  let result = structuredClone(board);
  movePiece(result, move);
  return {
    moves: [move],
    explosions: [],
    result: result,
  };
}

export function capture(board: Chessboard, move: Move): ChessActionLog {
  let result = structuredClone(board);
  const { to } = move;
  movePiece(result, move);
  const explosions = [to, ...getSurroundingExplosions(result, to)];
  explodeArea(result, to);
  return {
    moves: [move],
    explosions: explosions,
    result: result,
  };
}

export function enPassant(board: Chessboard, move: Move): ChessActionLog {
  let result = structuredClone(board);
  const { from, to } = move;
  const r1 = SQUARE_TO_INDEX[from][0];
  const c2 = SQUARE_TO_INDEX[to][1];
  const target = getSquareAtPos([r1, c2]) as Square;
  movePiece(result, move);
  explodeSquare(result, target)
  const explosions = [to, target, ...getSurroundingExplosions(result, to)];
  explodeArea(result, to);
  return {
    moves: [move],
    explosions: explosions,
    result: result,
  };
}
export interface castlingMove { king: Move, rook: Move, between: Square[] }
export const castlingMoves: Record<Color, { kingside: castlingMove, queenside: castlingMove }> = {
  [Color.WHITE]: {
    kingside: {
      king: { from: 'e1', to: 'g1' },
      rook: { from: 'h1', to: 'f1' },
      between: ['f1', 'g1'],
    },
    queenside: {
      king: { from: 'e1', to: 'c1' },
      rook: { from: 'a1', to: 'd1' },
      between: ['d1', 'c1', 'b1'],
    },
  },
  [Color.BLACK]: {
    kingside: {
      king: { from: 'e8', to: 'g8' },
      rook: { from: 'h8', to: 'f8' },
      between: ['f8', 'g8'],
    },
    queenside: {
      king: { from: 'e8', to: 'c8' },
      rook: { from: 'a8', to: 'd8' },
      between: ['d8', 'c8', 'b8'],
    },
  },
}

export function castleKingside(board: Chessboard, color: Color): ChessActionLog {
  let result = structuredClone(board);
  const { king, rook } = castlingMoves[color].kingside;
  movePiece(result, king);
  movePiece(result, rook);
  return {
    moves: [king, rook],
    explosions: [],
    result: result,
  };
}

export function castleQueenside(board: Chessboard, color: Color): ChessActionLog {
  let result = structuredClone(board);
  const { king, rook } = castlingMoves[color].queenside;
  movePiece(result, king);
  movePiece(result, rook);
  return {
    moves: [king, rook],
    explosions: [],
    result: result,
  };
}

