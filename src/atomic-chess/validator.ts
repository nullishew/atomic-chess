import { FEN, Square, CastleType, Chessboard, PIECE_TO_TYPE, PieceType, RANKS, PIECE_TO_COLOR, Move, CHESSBOARD_SQUARES, Color, PIECE_CAPTURE_PATTERNS, PIECE_MOVE_PATTERNS, getEnemyColor, moveSquare, CASTLE_MOVES } from "./atomicChess";
import { isAtomicCheck, findKing, isValidAtomicChessPosition, capture, standardMove, moveDouble, enPassant, castle } from "./chessboard";

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
  return RANKS.lastRank[PIECE_TO_COLOR[piece]] == square[1];
}

export function getAllValidMoves(gameState: FEN): Move[] {
  return CHESSBOARD_SQUARES.flatMap(from => getAllValidMovesFrom(gameState, from).map(to => ({ from: from, to: to })));
}

export function isCheckMate(gameState: FEN, activeColor: Color): boolean {
  return isAtomicCheck(gameState.board, activeColor) && !getAllValidMoves(gameState).length;
}

export function isStaleMate(gameState: FEN, activeColor: Color): boolean {
  return !isAtomicCheck(gameState.board, activeColor) && !getAllValidMoves(gameState).length && findKing(gameState.board, activeColor) != null;
}

function getPathFrom({ board, activeColor }: FEN, from: Square, capture: boolean): Square[] {
  const piece = board[from];
  if (!piece || PIECE_TO_COLOR[piece] != activeColor) return [];
  const { patterns, steps } = capture ? PIECE_CAPTURE_PATTERNS[piece] : PIECE_MOVE_PATTERNS[piece];
  const enemyColor = getEnemyColor(activeColor);
  return patterns.flatMap(offset => {
    const between: Square[] = [];
    for (let i = 1; i <= steps; i++) {
      const to = moveSquare(from, offset, i);
      if (!to) break;
      const currPiece = board[to];
      if (currPiece) {
        if (capture) return PIECE_TO_COLOR[currPiece] == enemyColor ? [to] : [];
        break;
      }
      between.push(to);
    }
    return capture ? [] : between;
  })
}

export function getValidStandardCapturesFrom(gameState: FEN, from: Square): Square[] {
  const { board, activeColor } = gameState;
  return getPathFrom(gameState, from, true).filter(to => isValidAtomicChessPosition(capture(board, { from: from, to: to }).result, activeColor));
}

export function getValidStandardMovesFrom(gameState: FEN, from: Square): Square[] {
  const { board, activeColor } = gameState;
  return getPathFrom(gameState, from, false).filter(to => isValidAtomicChessPosition(standardMove(board, { from: from, to: to }).result, activeColor));
}

export function getValidDoubleMovesFrom({ board, activeColor }: FEN, from: Square): Square[] {
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN || PIECE_TO_COLOR[piece] != activeColor) return [];
  if (from[1] != RANKS.second[activeColor]) return [];
  const pattern = PIECE_MOVE_PATTERNS[piece].patterns[0];
  const between = moveSquare(from, pattern);
  if (!between || board[between]) return [];
  const to = moveSquare(from, pattern, 2);
  if (!to || board[to]) return [];
  if (!isValidAtomicChessPosition(moveDouble(board, { from: from, to: to }).result, activeColor)) return [];
  return [to];
}

export function getValidEnPassantsFrom({ board, activeColor, enPassantTargets }: FEN, from: Square): Square[] {
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN || PIECE_TO_COLOR[piece] != activeColor) return [];
  return PIECE_CAPTURE_PATTERNS[piece].patterns.flatMap(offset => moveSquare(from, offset) ?? [])
    .filter(to => enPassantTargets.includes(to) && isValidAtomicChessPosition(enPassant(board, { from: from, to: to }).result, activeColor));
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
  return isValidAtomicChessPosition(castle(board, activeColor, castleSide).result, activeColor);
}
