import { FEN, Square, CastleType, Chessboard, PIECE_TO_TYPE, PieceType, PIECE_TO_COLOR, Move, CHESSBOARD_SQUARES, Color, PIECE_CAPTURE_PATTERNS, PIECE_MOVE_PATTERNS, getEnemyColor, moveSquare, CASTLE_MOVES, PAWN_DOUBLE_MOVES, PROMOTION_SQUARES } from "./atomicChess";
import { isAtomicCheck, findKing, isValidAtomicChessPosition, capture, standardMove, moveDouble, enPassant, castle } from "./chessboard";

// Function to get all valid moves from a given square
export function getAllValidMovesFrom(gameState: FEN, from: Square): Square[] {
  return [
    ...getValidCastlesFrom(gameState, CastleType.KINGSIDE, from), // Valid castle moves
    ...getValidCastlesFrom(gameState, CastleType.QUEENSIDE, from),
    ...getValidDoubleMovesFrom(gameState, from), // Valid pawn double moves
    ...getValidEnPassantsFrom(gameState, from), // Valid en passant moves
    ...getValidStandardCapturesFrom(gameState, from), // Valid standard captures
    ...getValidStandardMovesFrom(gameState, from), // Valid standard moves
  ];
}

// Function to get all valid moves for the current game state
export function getAllValidMoves(gameState: FEN): Move[] {
  return CHESSBOARD_SQUARES.flatMap(from => getAllValidMovesFrom(gameState, from).map(to => ({ from: from, to: to })));
}

// Function to check if the current player is in checkmate
export function isCheckmate(gameState: FEN, activeColor: Color): boolean {
  return isAtomicCheck(gameState.board, activeColor) && !getAllValidMoves(gameState).length;
}

// Function to check if the game is in stalemate
export function isStalemate(gameState: FEN, activeColor: Color): boolean {
  return !isAtomicCheck(gameState.board, activeColor) && !getAllValidMoves(gameState).length && findKing(gameState.board, activeColor) != null;
}

// Function to check if a pawn at a given square can be promoted
export function canPromotePawnAt(board: Chessboard, square: Square): boolean {
  const piece = board[square];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN) return false;
  return PROMOTION_SQUARES[PIECE_TO_COLOR[piece]].includes(square);
}

// Function to get valid standard captures from a given square
export function getValidStandardCapturesFrom(gameState: FEN, from: Square): Square[] {
  const { board, activeColor } = gameState;
  const piece = board[from];
  if (!piece || PIECE_TO_COLOR[piece] != activeColor) return [];
  const { patterns, steps } = PIECE_CAPTURE_PATTERNS[piece];
  const enemyColor = getEnemyColor(activeColor);
  return patterns.flatMap(offset => {
    for (let i = 1; i <= steps; i++) {
      const to = moveSquare(from, offset, i);
      if (!to) return [];
      const currPiece = board[to];
      if (currPiece) return (PIECE_TO_COLOR[currPiece] == enemyColor) ? [to] : [];
    }
    return [];
  }).filter(to => isValidAtomicChessPosition(capture(board, { from: from, to: to }).result, activeColor));
}

// Function to get valid standard moves from a given square
export function getValidStandardMovesFrom(gameState: FEN, from: Square): Square[] {
  const { board, activeColor } = gameState;
  const piece = board[from];
  if (!piece || PIECE_TO_COLOR[piece] != activeColor) return [];
  const { patterns, steps } = PIECE_MOVE_PATTERNS[piece];
  return patterns.flatMap(offset => {
    const between: Square[] = [];
    for (let i = 1; i <= steps; i++) {
      const to = moveSquare(from, offset, i);
      if (!to || board[to]) return between;
      between.push(to);
    }
    return between;
  }).filter(to => isValidAtomicChessPosition(standardMove(board, { from: from, to: to }).result, activeColor));
}

// Function to get valid double moves from a given square
export function getValidDoubleMovesFrom({ board, activeColor }: FEN, from: Square): Square[] {
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN || PIECE_TO_COLOR[piece] != activeColor) return [];
  if (!(from in PAWN_DOUBLE_MOVES[activeColor])) return [];
  const { between, to } = PAWN_DOUBLE_MOVES[activeColor][from];
  if (board[between] || board[to]) return [];
  return isValidAtomicChessPosition(moveDouble(board, { from: from, to: to }).result, activeColor) ? [to] : [];
}

// Function to get valid en passant moves from a given square
export function getValidEnPassantsFrom({ board, activeColor, enPassantTargets }: FEN, from: Square): Square[] {
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN || PIECE_TO_COLOR[piece] != activeColor) return [];
  return PIECE_CAPTURE_PATTERNS[piece].patterns.flatMap(offset => moveSquare(from, offset) ?? [])
    .filter(to => enPassantTargets.includes(to) && isValidAtomicChessPosition(enPassant(board, { from: from, to: to }).result, activeColor));
}

// Function to get valid castle moves from a given square
export function getValidCastlesFrom(gameState: FEN, castleSide: CastleType, from: Square): Square[] {
  const { board, activeColor, hasCastlingRights } = gameState;
  if (!hasCastlingRights[activeColor][castleSide] || isAtomicCheck(board, activeColor)) return [];
  const { kingMove, between, rookMove } = CASTLE_MOVES[activeColor][castleSide];
  if (from != kingMove.from) return [];
  const king = board[kingMove.from];
  const rook = board[rookMove.from];
  if (!king || PIECE_TO_TYPE[king] != PieceType.KING || PIECE_TO_COLOR[king] != activeColor) return [];
  if (!rook || PIECE_TO_TYPE[rook] != PieceType.ROOK || PIECE_TO_COLOR[rook] != activeColor) return [];
  if (between.some(square => board[square])) return [];
  return isValidAtomicChessPosition(castle(board, activeColor, castleSide).result, activeColor) ? [kingMove.to] : [];
}