import { Move, Square, Chessboard, Piece, CHESSBOARD_SQUARES, Color, SQUARE_TO_INDEX, gridIndexToSquare, CastleType, PIECE_TO_TYPE, PieceType, CASTLE_MOVES, MoveType } from "./atomicChess";
import { canPromotePawnAt } from "./validator";

// Defines a structure for logging chess actions
export interface AtomicChessResponse {
  moves: Move[],
  explosions: Square[],
  result: Chessboard,
  moveType: MoveType,
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
export function standardMove(board: Chessboard, move: Move): AtomicChessResponse {
  let result = structuredClone(board);
  movePiece(result, move);
  return {
    moves: [move],
    explosions: [],
    result: result,
    moveType: canPromotePawnAt(result, move.to) ? MoveType.PROMOTION : MoveType.STANDARD_MOVE,
  };
}

// Moves a pawn two squares and returns information about the action
export function moveDouble(board: Chessboard, move: Move): AtomicChessResponse {
  let result = structuredClone(board);
  movePiece(result, move);
  return {
    moves: [move],
    explosions: [],
    result: result,
    moveType: MoveType.DOUBLE,
  };
}

// Performs a standard capture and returns information about the action
export function capture(board: Chessboard, move: Move): AtomicChessResponse {
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
    moveType: MoveType.CAPTURE,
  };
}

// Performs an en passant capture and returns information about the action
export function enPassant(board: Chessboard, move: Move): AtomicChessResponse {
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
    moveType: MoveType.EN_PASSANT,
  };
}

// Performs a kingside castle for the specified player and returns information about the action
export function castleKingside(board: Chessboard, color: Color): AtomicChessResponse {
  return castle(board, color, CastleType.KINGSIDE);
}

// Performs a queenside castle for the specified player and returns information about the action
export function castleQueenside(board: Chessboard, color: Color): AtomicChessResponse {
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
function castle(board: Chessboard, color: Color, castleSide: CastleType) {
  let result = structuredClone(board);
  const { kingMove: king, rookMove: rook } = CASTLE_MOVES[color][castleSide];
  movePiece(result, king);
  movePiece(result, rook);
  return {
    moves: [king, rook],
    explosions: [],
    result: result,
    moveType: castleSide == CastleType.KINGSIDE ? MoveType.KINGSIDE_CASTLE : MoveType.QUEENSIDE_CASTLE,
  };
}