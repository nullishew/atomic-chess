import { FEN, Square, CastleType, Chessboard, PIECE_TO_TYPE, PieceType, PIECE_TO_COLOR, Color, Move, getEnemyColor, Piece, SQUARE_TO_INDEX, PIECE_CAPTURE_PATTERNS, gridIndexToSquare, MoveType, PIECE_MOVE_PATTERNS, CASTLE_MOVES } from "./atomicChess";
import { findKing, isAdjacent, capture, enPassant, castleKingside, castleQueenside, standardMove, moveDouble } from "./chessboard";

export function getAllValidMovesFrom(gameState: FEN, from: Square): Square[] {
  return [
    ...getValidCastlesFrom(gameState, CastleType.KINGSIDE, from),
    ...getValidCastlesFrom(gameState, CastleType.QUEENSIDE, from),
    ...getValidDoubleMovesFrom(gameState, from),
    ...getValidEnPassantsFrom(gameState, from),
    ...getValidStandardCapturesFrom(gameState, from),
    ...getValidStandardMovesFrom(gameState, from),
  ];
}

export function canPromotePawnAt(board: Chessboard, square: Square): boolean {
  const piece = board[square];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN) return false;
  const endRank = PIECE_TO_COLOR[piece] == Color.WHITE ? '8' : '1';
  const r = square[1];
  return endRank == r;
}

export function isValidStandardMove(gameState: FEN, { from, to }: Move): boolean {
  return getValidStandardMovesFrom(gameState, from).includes(to);
}

export function isValidStandardCapture(gameState: FEN, { from, to }: Move): boolean {
  return getValidStandardCapturesFrom(gameState, from).includes(to);
}

export function isValidDoubleMove(gameState: FEN, { from, to }: Move): boolean {
  return getValidDoubleMovesFrom(gameState, from).includes(to);
}

export function isValidEnPassant(gameState: FEN, { from, to }: Move): boolean {
  return getValidEnPassantsFrom(gameState, from).includes(to);
}

export function isValidKingsideCastle(gameState: FEN, { from, to }: Move): boolean {
  return getValidCastlesFrom(gameState, CastleType.KINGSIDE, from).includes(to);
}

export function isValidQueensideCastle(gameState: FEN, { from, to }: Move): boolean {
  return getValidCastlesFrom(gameState, CastleType.QUEENSIDE, from).includes(to);
}

export function isAtomicCheck(board: Chessboard, activeColor: Color): boolean {
  const enemyColor = getEnemyColor(activeColor);
  const kingPos = findKing(board, activeColor);
  const enemyKingPos = findKing(board, enemyColor);
  if (!kingPos || !enemyKingPos) return false;
  if (isAdjacent(kingPos, enemyKingPos)) return false;
  for (let [piece, color] of Object.entries(PIECE_TO_COLOR) as [Piece, Color][]) {
    if (activeColor == color) continue;
    const [r, c] = SQUARE_TO_INDEX[kingPos];
    const { pattern, steps } = PIECE_CAPTURE_PATTERNS[piece];
    for (let [dr, dc] of pattern) {
      for (let i = 1; i <= steps; i++) {
        const square = gridIndexToSquare([r - i * dr, c - i * dc]);
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

export function getValidPlayerMoves(gameState: FEN): Move[] {
  const { board } = gameState;
  return (Object.keys(board) as Square[])
    .map(from => getAllValidMovesFrom(gameState, from).map(to => ({ from: from, to: to })))
    .flat();
}

export function existsValidPlayerMoves(gameState: FEN): boolean {
  return getValidPlayerMoves(gameState).length > 0;
}

export function isCheckMate(gameState: FEN, activeColor: Color): boolean {
  return isAtomicCheck(gameState.board, activeColor) && !getValidPlayerMoves(gameState).length;
}

export function isStaleMate(gameState: FEN, activeColor: Color): boolean {
  return !isAtomicCheck(gameState.board, activeColor) && !getValidPlayerMoves(gameState).length && findKing(gameState.board, activeColor) != null;
}

export function getSafeMoves(board: Chessboard, activeColor: Color, from: Square, tos: Square[], moveType: MoveType): Square[] {
  return tos.filter(to => isKingSafeAfterMove(board, activeColor, { from: from, to: to }, moveType));
}

export function isKingSafeAfterMove(board: Chessboard, activeColor: Color, move: Move, moveType: MoveType): boolean {
  let result: Chessboard;
  switch (moveType) {
    case MoveType.CAPTURE:
      ({ result } = capture(board, move));
      break;
    case MoveType.EN_PASSANT:
      ({ result } = enPassant(board, move));
      break;
    case MoveType.KINGSIDE_CASTLE:
      ({ result } = castleKingside(board, activeColor));
      break;
    case MoveType.QUEENSIDE_CASTLE:
      ({ result } = castleQueenside(board, activeColor));
      break;
    case MoveType.DOUBLE:
      ({ result } = moveDouble(board, move));
      break;
    default:
      ({ result } = standardMove(board, move));
  }
  return findKing(result, activeColor) != null && !isAtomicCheck(result, activeColor);
}

export function getValidStandardCapturesFrom(gameState: FEN, from: Square): Square[] {
  const { board, activeColor } = gameState;
  const piece = board[from];
  if (!piece || PIECE_TO_COLOR[piece] != activeColor) return [];
  const enemyColor = getEnemyColor(activeColor);
  const [r, c] = SQUARE_TO_INDEX[from];
  const { pattern, steps } = PIECE_CAPTURE_PATTERNS[piece];
  const targets: Square[] = [];
  for (let [dr, dc] of pattern) {
    for (let i = 1; i <= steps; i++) {
      const to = gridIndexToSquare([r + i * dr, c + i * dc]);
      if (!to) break;
      const piece2 = board[to];
      if (!piece2) continue;
      if (PIECE_TO_COLOR[piece2] != enemyColor) break;
      targets.push(to);
      break;
    }
  }
  return getSafeMoves(board, activeColor, from, targets, MoveType.CAPTURE);
}

export function getValidStandardMovesFrom(gameState: FEN, from: Square): Square[] {
  const { board, activeColor } = gameState;
  const piece = board[from];
  if (!piece || PIECE_TO_COLOR[piece] != activeColor) return [];
  const [r, c] = SQUARE_TO_INDEX[from];
  const { pattern, steps } = PIECE_MOVE_PATTERNS[piece];
  const targets: Square[] = [];
  for (let [dr, dc] of pattern) {
    for (let i = 1; i <= steps; i++) {
      const square = gridIndexToSquare([r + i * dr, c + i * dc]);
      if (!square || board[square]) break;
      targets.push(square);
    }
  }
  return getSafeMoves(board, activeColor, from, targets, MoveType.STANDARD_MOVE);
}

export function getValidDoubleMovesFrom(gameState: FEN, from: Square): Square[] {
  const { board, activeColor } = gameState;
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN || PIECE_TO_COLOR[piece] != activeColor) return [];
  const [r, c] = SQUARE_TO_INDEX[from];
  const startingRank = activeColor == Color.WHITE ? 1 : 6;
  if (r != startingRank) return [];
  const { pattern } = PIECE_MOVE_PATTERNS[piece];
  const [dir] = pattern[0];
  const square1 = gridIndexToSquare([r + dir, c]);
  if (!square1 || board[square1]) return [];
  const to = gridIndexToSquare([r + 2 * dir, c]);
  if (!to || board[to]) return [];
  return getSafeMoves(board, activeColor, from, [to], MoveType.DOUBLE);
}

export function getValidEnPassantsFrom(gameState: FEN, from: Square): Square[] {
  const { board, activeColor, enPassantTargets } = gameState;
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN || PIECE_TO_COLOR[piece] != activeColor) return [];
  const [r, c] = SQUARE_TO_INDEX[from];
  const targets = PIECE_CAPTURE_PATTERNS[piece].pattern.map(([dr, dc]) => gridIndexToSquare([r + dr, c + dc]))
    .filter(square => square && enPassantTargets.includes(square)) as Square[];
  return getSafeMoves(board, activeColor, from, targets, MoveType.EN_PASSANT);
}

export function getValidCastlesFrom(gameState: FEN, castleSide: CastleType, from: Square): Square[] {
  const { kingMove } = CASTLE_MOVES[gameState.activeColor][castleSide];
  if (from != kingMove.from || !canCastle(gameState, castleSide)) return [];
  return [kingMove.to];
}

function canCastle({ board, activeColor, hasCastlingRights }: FEN, castleSide: CastleType): boolean {
  if (!hasCastlingRights[activeColor][castleSide] || isAtomicCheck(board, activeColor)) return false;
  const { kingMove, squaresBetween, rookMove } = CASTLE_MOVES[activeColor][castleSide];
  const king = board[kingMove.from];
  const rook = board[rookMove.from];
  if (!king || PIECE_TO_TYPE[king] != PieceType.KING || PIECE_TO_COLOR[king] != activeColor) return false;
  if (!rook || PIECE_TO_TYPE[rook] != PieceType.ROOK || PIECE_TO_COLOR[rook] != activeColor) return false;
  if (squaresBetween.some(square => board[square])) return false;
  return isKingSafeAfterMove(board, activeColor, kingMove, castleSide == CastleType.KINGSIDE ? MoveType.KINGSIDE_CASTLE : MoveType.QUEENSIDE_CASTLE);
}
