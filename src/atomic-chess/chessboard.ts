import { Move, Square, Chessboard, Piece, CHESSBOARD_SQUARES, Color, SQUARE_TO_INDEX, gridIndexToSquare, CastleType, PIECE_TO_TYPE, PieceType, CASTLE_MOVES, MoveType, squareIndexToSquare, PIECE_CAPTURE_PATTERNS, PIECE_TO_COLOR, getEnemyColor, moveSquare } from "./atomicChess";
import { canPromotePawnAt } from "./validator";

// Defines a structure for providing information about the result of a move on an atomic chess board
export interface MoveData {
  result: Chessboard,
  moveType: MoveType,
  actions: {
    move: Move,
    explode: boolean
  }[],
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
export function standardMove(board: Chessboard, move: Move): MoveData {
  let result = structuredClone(board);
  movePiece(result, move);
  return {
    result: result,
    moveType: canPromotePawnAt(result, move.to) ? MoveType.PROMOTION : MoveType.STANDARD_MOVE,
    actions: [{move: move, explode: false}],
  };
}

// Moves a pawn two squares and returns information about the action
export function moveDouble(board: Chessboard, move: Move): MoveData {
  let result = structuredClone(board);
  movePiece(result, move);
  return {
    result: result,
    moveType: MoveType.DOUBLE,
    actions: [{move: move, explode: false}],
  };
}

// Performs a standard capture and returns information about the action
export function capture(board: Chessboard, move: Move): MoveData {
  let result = structuredClone(board);
  const { to } = move;
  movePiece(result, move);
  const surroundingExplosions = getSurroundingExplosions(result, to);
  surroundingExplosions.forEach(square => explodeSquare(result, square));
  explodeSquare(result, to);
  return {
    result: result,
    moveType: MoveType.CAPTURE,
    actions: [
      {move: move, explode: true},
      {move: {from: to, to: to}, explode: true},
      ...surroundingExplosions.map(square => ({move: {from: square, to: square}, explode: true})),
    ],
  };
}

// Performs an en passant capture and returns information about the action
export function enPassant(board: Chessboard, move: Move): MoveData {
  let result = structuredClone(board);
  const { from, to } = move;
  const r1 = SQUARE_TO_INDEX[from][0];
  const c2 = SQUARE_TO_INDEX[to][1];
  const target = squareIndexToSquare([r1, c2]);
  movePiece(result, move);
  explodeSquare(result, target)
  const surroundingExplosions = getSurroundingExplosions(result, to);
  surroundingExplosions.forEach(square => explodeSquare(result, square));
  explodeSquare(result, to);
  return {
    result: result,
    moveType: MoveType.EN_PASSANT,
    actions: [
      {move: move, explode: true},
      {move: {from: target, to: target}, explode: true},
      ...surroundingExplosions.map(square => ({move: {from: square, to: square}, explode: true})),
    ],
  };
}

// Castles the specified player color to the specified side and returns information about the action
export function castle(board: Chessboard, color: Color, castleSide: CastleType) : MoveData {
  let result = structuredClone(board);
  const { kingMove, rookMove } = CASTLE_MOVES[color][castleSide];
  movePiece(result, kingMove);
  movePiece(result, rookMove);
  return {
    result: result,
    moveType: castleSide == CastleType.KINGSIDE ? MoveType.KINGSIDE_CASTLE : MoveType.QUEENSIDE_CASTLE,
    actions: [
      {move: kingMove, explode: false},
      {move: rookMove, explode: false},
    ],
  };
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

// Checks if the specified player is in atomic check
export function isAtomicCheck(board: Chessboard, activeColor: Color): boolean {
  const enemyColor = getEnemyColor(activeColor);
  const kingPos = findKing(board, activeColor);
  const enemyKingPos = findKing(board, enemyColor);
  if (!kingPos || !enemyKingPos) return false;
  if (isAdjacent(kingPos, enemyKingPos)) return false;
  for (let [piece, color] of Object.entries(PIECE_TO_COLOR) as [Piece, Color][]) {
    if (activeColor == color) continue;
    const { patterns: pattern, steps } = PIECE_CAPTURE_PATTERNS[piece];
    for (let offset of pattern) {
      for (let i = 1; i <= steps; i++) {
        const square = moveSquare(kingPos, offset, -i);
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

// Checks if the atomic chess position causes the specified player to lose
export function isValidAtomicChessPosition(board: Chessboard, activeColor: Color): boolean {
  return findKing(board, activeColor) != null && !isAtomicCheck(board, activeColor);
}
