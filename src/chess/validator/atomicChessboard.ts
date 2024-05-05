import { CHESSBOARD_SQUARES, gridIndexToSquare } from "../atomicChessData";
import { Square, SQUARE_TO_INDEX, Move, Chessboard, Piece, Color, PIECE_TO_TYPE, PieceType, CASTLE_MOVES, CastleType } from "../atomicChessData";

// Defines a structure for logging chess actions
export interface ChessActionLog {
  moves: Move[],
  explosions: Square[],
  result: Chessboard,
}

// Finds a specific piece on the board
export function findPiece(board: Chessboard, piece: Piece): Square | null {
  return CHESSBOARD_SQUARES.find(key => board[key] == piece) ?? null;
}

// Finds the king of a specific color on the board
export function findKing(board: Chessboard, activeColor: Color): Square | null {
  return findPiece(board, activeColor == Color.WHITE ? 'K' : 'k');
}

// Checks if two squares are adjacent to each other
export function isAdjacent(square1: Square, square2: Square) {
  const [r1, c1] = SQUARE_TO_INDEX[square1];
  const [r2, c2] = SQUARE_TO_INDEX[square2];
  return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
}

// Performs a standard, non capturing, move and returns information about the action
export function standardMove(board: Chessboard, move: Move): ChessActionLog {
  let result = structuredClone(board);
  movePiece(result, move);
  return {
    moves: [move],
    explosions: [],
    result: result,
  };
}

// Performs a standard capture and returns information about the action
export function capture(board: Chessboard, move: Move): ChessActionLog {
  let result = structuredClone(board);
  const { to } = move;
  movePiece(result, move);
  const surroundingExplosions = getSurroundingExplosions(result, to);
  surroundingExplosions.forEach(square => explodeSquare(result, square));
  explodeSquare(result, to);
  return {
    moves: [move],
    explosions: [to, ...surroundingExplosions],
    result: result,
  };
}

// Performs an en passant capture and returns information about the action
export function enPassant(board: Chessboard, move: Move): ChessActionLog {
  let result = structuredClone(board);
  const { from, to } = move;
  const r1 = SQUARE_TO_INDEX[from][0];
  const c2 = SQUARE_TO_INDEX[to][1];
  const target = gridIndexToSquare([r1, c2]) as Square;
  movePiece(result, move);
  explodeSquare(result, target)
  const surroundingExplosions = getSurroundingExplosions(result, to);
  surroundingExplosions.forEach(square => explodeSquare(result, square));
  explodeSquare(result, to);
  return {
    moves: [move],
    explosions: [to, target, ...surroundingExplosions],
    result: result,
  };
}

// Performs a kingside castle for the specified player and returns information about the action
export function castleKingside(board: Chessboard, color: Color): ChessActionLog {
  return castle(board, color, CastleType.KINGSIDE);
}

// Performs a queenside castle for the specified player and returns information about the action
export function castleQueenside(board: Chessboard, color: Color): ChessActionLog {
  return castle(board, color, CastleType.QUEENSIDE);
}

// Moves a piece from one square to another
function movePiece(board: Chessboard, move: Move) {
  const { from, to } = move;
  board[to] = board[from];
  board[from] = null;
}

// Explodes a piece at a given square
function explodeSquare(board: Chessboard, square: Square) {
  board[square] = null;
}

// Returns a list of surrounding squares that will explode given a target square being captured
function getSurroundingExplosions(board: Chessboard, square: Square): Square[] {
  let explosions: Square[] = [];
  const [r, c] = SQUARE_TO_INDEX[square];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr == 0 && dc == 0) continue;
      const adjSquare = gridIndexToSquare([r + dr, c + dc]);
      if (!adjSquare) continue;
      const piece = board[adjSquare];
      if (!piece || PIECE_TO_TYPE[piece] == PieceType.PAWN) continue;
      explosions.push(adjSquare);
    }
  }
  return explosions;
}

// Castles the specified player color to the specified side and returns information about the action
function castle(board: Chessboard, color: Color, side: CastleType) {
  let result = structuredClone(board);
  const { kingMove: king, rookMove: rook } = CASTLE_MOVES[color][side];
  movePiece(result, king);
  movePiece(result, rook);
  return {
    moves: [king, rook],
    explosions: [],
    result: result,
  };
}