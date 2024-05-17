import { FEN, Square, Chessboard, PIECE_TO_TYPE, PieceType, PIECE_TO_COLOR, CHESSBOARD_SQUARES, Color, PROMOTION_SQUARES, CASTLE_MOVES, CastleType, Move, MoveType, PAWN_DOUBLE_MOVES, PIECE_CAPTURE_PATTERNS, PIECE_MOVE_PATTERNS, Piece, SQUARE_TO_INDEX, SquareOffset, getEnemyColor, moveSquare, squareIndexToSquare } from "./atomicChess";

export const rookStartSquaresToCastleSide: Record<Color, { [key: string]: CastleType }> = {
  [Color.BLACK]: {
    'a8': CastleType.QUEENSIDE,
    'h8': CastleType.KINGSIDE
  },
  [Color.WHITE]: {
    'a1': CastleType.QUEENSIDE,
    'h1': CastleType.KINGSIDE
  }
};

export enum Flag {
  PROMOTION = 'promotion',
  DOUBLE = 'double',
  KING_MOVE = 'king move',
  KINGSIDE_ROOK_MOVE = 'kingside rook move',
  QUEENSIDE_ROOK_MOVE = 'queenside rook move',
  KINGSIDE_ROOK_CAPTURED = 'kingside rook captured',
  QUEENSIDE_ROOK_CAPTURED = 'queenside rook captured',
  PAWN_MOVE = 'pawn move',
  CAPTURE = 'capture',
}

export type ExternalMove = {
  color: Color,
  from: Square,
  to: Square,
  piece: Piece,
  captured?: boolean,
  captures?: Piece[],
  flags: Flag[],
  result: Chessboard,
  moveType: MoveType,
  actions: {
    move: Move,
    explode: boolean
  }[],
}

const ADJ_SQUARES: SquareOffset[] = [
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1]
];

// Function to get all valid moves for the current game state
export function hasLegalMoves(gameState: FEN): boolean {
  return CHESSBOARD_SQUARES.some(from => legalMovesFrom(gameState, from).length);
}

// Function to check if the current player is in checkmate
export function isCheckmate(gameState: FEN, activeColor: Color): boolean {
  return isAtomicCheck(gameState.board, activeColor) && !hasLegalMoves(gameState);
}

// Function to check if the game is in stalemate
export function isStalemate(gameState: FEN, activeColor: Color): boolean {
  return !isAtomicCheck(gameState.board, activeColor) && !hasLegalMoves(gameState) && findKing(gameState.board, activeColor) != null;
}

// Function to check if a pawn at a given square can be promoted
export function canPromotePawnAt(board: Chessboard, square: Square): boolean {
  const piece = board[square];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN) return false;
  return PROMOTION_SQUARES[PIECE_TO_COLOR[piece]].includes(square);
}

export function legalMovesFrom(gameState: FEN, from: Square): ExternalMove[] {
  return movesFrom(gameState, from).filter(isLegalMove);
}

function isLegalMove({ result, color }: ExternalMove): boolean {
  return isLegalPosition(result, color);
}

function movesFrom(gameState: FEN, from: Square): ExternalMove[] {
  return [
    ...castlesFrom(gameState, CastleType.KINGSIDE, from),
    ...castlesFrom(gameState, CastleType.QUEENSIDE, from),
    ...doubleMovesFrom(gameState, from),
    ...enPassantsFrom(gameState, from),
    ...capturesFrom(gameState, from),
    ...standardMovesFrom(gameState, from),
  ]
}

// Function to get valid standard captures from a given square
function capturesFrom(gameState: FEN, from: Square): ExternalMove[] {
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
  })
    .map(to => {
      const result = structuredClone(board);
      const move = { from: from, to: to };
      movePiece(result, move);
      const explosions = getSurroundingExplosions(result, to);
      explosions.forEach(square => explodeSquare(result, square));
      explodeSquare(result, to);

      const flags = [Flag.CAPTURE];
      [to, ...explosions].forEach(square => {
        if (board[square] == PieceType.ROOK) {
          if (from == CASTLE_MOVES[activeColor][CastleType.KINGSIDE].rookMove.from) {
            flags.push(Flag.KINGSIDE_ROOK_CAPTURED);
          } else if (from == CASTLE_MOVES[activeColor][CastleType.QUEENSIDE].rookMove.from) {
            flags.push(Flag.QUEENSIDE_ROOK_CAPTURED);
          }
        }
      });


      return ({
        from: from,
        to: to,
        piece: piece,
        flags: flags,
        color: activeColor,
        moveType: MoveType.CAPTURE,
        result: result,
        actions: [
          { move: move, explode: true },
          { move: { from: to, to: to }, explode: true },
          ...explosions.map(square => ({ move: { from: square, to: square }, explode: true })),
        ],
      })
    });
}

// Function to get valid standard moves from a given square
function standardMovesFrom(gameState: FEN, from: Square): ExternalMove[] {
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
  })
    .map(to => {
      const result = structuredClone(board);
      movePiece(result, { from: from, to: to });
      const flags = [];
      if (piece == PieceType.PAWN) {
        flags.push(Flag.PAWN_MOVE);
      }
      if (piece == PieceType.KING) {
        flags.push(Flag.KING_MOVE);
      }
      if (piece == PieceType.ROOK) {
        if (from == CASTLE_MOVES[activeColor][CastleType.KINGSIDE].rookMove.from) {
          flags.push(Flag.KINGSIDE_ROOK_MOVE);
        } else if (from == CASTLE_MOVES[activeColor][CastleType.QUEENSIDE].rookMove.from) {
          flags.push(Flag.QUEENSIDE_ROOK_MOVE);
        }
      }
      if (canPromotePawnAt(result, to)) {
        flags.push(Flag.PROMOTION);
      }

      return ({
        from: from,
        to: to,
        piece: piece,
        flags: flags,
        color: activeColor,
        moveType: MoveType.STANDARD_MOVE,
        result: result,
        actions: [{ move: { from: from, to: to }, explode: false }],
      })
    });
}

// Function to get valid double moves from a given square
function doubleMovesFrom({ board, activeColor }: FEN, from: Square): ExternalMove[] {
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN || PIECE_TO_COLOR[piece] != activeColor) return [];
  if (!(from in PAWN_DOUBLE_MOVES[activeColor])) return [];
  const { between, to } = PAWN_DOUBLE_MOVES[activeColor][from];
  if (board[between] || board[to]) return [];

  const result = structuredClone(board);
  const move = { from: from, to: to };
  movePiece(result, move);
  return [{
    from: from,
    to: to,
    piece: piece,
    flags: [Flag.DOUBLE],
    color: activeColor,
    moveType: MoveType.STANDARD_MOVE,
    result: result,
    actions: [{ move: move, explode: false }],
  }]
};

// Function to get valid en passant moves from a given square
function enPassantsFrom({ board, activeColor, enPassantTargets }: FEN, from: Square): ExternalMove[] {
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN || PIECE_TO_COLOR[piece] != activeColor) return [];

  return PIECE_CAPTURE_PATTERNS[piece].patterns.flatMap(offset => moveSquare(from, offset) ?? [])
    .filter(to => enPassantTargets.includes(to))
    .map(to => {
      const move = { from: from, to: to };
      const result = structuredClone(board);
      const r1 = SQUARE_TO_INDEX[from][0];
      const c2 = SQUARE_TO_INDEX[to][1];
      const target = squareIndexToSquare([r1, c2]);
      movePiece(result, move);
      explodeSquare(result, target)
      const explosions = getSurroundingExplosions(result, to);
      explosions.forEach(square => explodeSquare(result, square));
      explodeSquare(result, to);

      return ({
        from: from,
        to: to,
        piece: piece,
        flags: [Flag.CAPTURE],
        color: activeColor,
        moveType: MoveType.EN_PASSANT,
        result: result,
        actions: [
          { move: move, explode: true },
          { move: { from: target, to: target }, explode: true },
          ...explosions.map(square => ({ move: { from: square, to: square }, explode: true })),
        ],
      })
    });
}

function castlesFrom(gameState: FEN, castleSide: CastleType, from: Square): ExternalMove[] {
  const { board, activeColor, hasCastlingRights } = gameState;
  if (!hasCastlingRights[activeColor][castleSide] || isAtomicCheck(board, activeColor)) return [];
  const { kingMove, between, rookMove } = CASTLE_MOVES[activeColor][castleSide];
  if (from != kingMove.from) return [];
  const king = board[kingMove.from];
  const rook = board[rookMove.from];
  if (!king || PIECE_TO_TYPE[king] != PieceType.KING || PIECE_TO_COLOR[king] != activeColor) return [];
  if (!rook || PIECE_TO_TYPE[rook] != PieceType.ROOK || PIECE_TO_COLOR[rook] != activeColor) return [];
  if (between.some(square => board[square])) return [];

  const result = structuredClone(board);
  movePiece(result, { from: kingMove.from, to: kingMove.to });
  movePiece(result, { from: rookMove.from, to: rookMove.to });

  return [{
    from: from,
    to: kingMove.to,
    piece: king,
    flags: [Flag.KING_MOVE, castleSide == CastleType.KINGSIDE ? Flag.KINGSIDE_ROOK_MOVE : Flag.QUEENSIDE_ROOK_MOVE],
    color: activeColor,
    moveType: castleSide == CastleType.KINGSIDE ? MoveType.KINGSIDE_CASTLE : MoveType.QUEENSIDE_CASTLE,
    result: result,
    actions: [
      { move: kingMove, explode: false },
      { move: rookMove, explode: false },
    ],
  }];
}

// Moves a piece from one square to another
function movePiece(board: Chessboard, { from, to }: Move) {
  board[to] = board[from];
  board[from] = null;
}

// Explodes a piece at a given square
function explodeSquare(board: Chessboard, square: Square) {
  board[square] = null;
}

// Returns a list of surrounding squares that will explode given a target square being captured
function getSurroundingExplosions(board: Chessboard, square: Square): Square[] {
  return ADJ_SQUARES.flatMap(offset => moveSquare(square, offset) ?? []).filter(to => {
    const piece = board[to];
    return piece && PIECE_TO_TYPE[piece] != PieceType.PAWN
  });
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
export function isLegalPosition(board: Chessboard, activeColor: Color): boolean {
  return findKing(board, activeColor) != null && !isAtomicCheck(board, activeColor);
}
