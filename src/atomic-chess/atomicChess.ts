// Chess validation system using a mix of the 0x88 representation and a dictionary mapping squares to pieces to represent a chessboard

export const SQUARE_TO_X88: Record<Square, number> = {
  a1: 0x00, b1: 0x01, c1: 0x02, d1: 0x03, e1: 0x04, f1: 0x05, g1: 0x06, h1: 0x07,
  a2: 0x10, b2: 0x11, c2: 0x12, d2: 0x13, e2: 0x14, f2: 0x15, g2: 0x16, h2: 0x17,
  a3: 0x20, b3: 0x21, c3: 0x22, d3: 0x23, e3: 0x24, f3: 0x25, g3: 0x26, h3: 0x27,
  a4: 0x30, b4: 0x31, c4: 0x32, d4: 0x33, e4: 0x34, f4: 0x35, g4: 0x36, h4: 0x37,
  a5: 0x40, b5: 0x41, c5: 0x42, d5: 0x43, e5: 0x44, f5: 0x45, g5: 0x46, h5: 0x47,
  a8: 0x70, b8: 0x71, c8: 0x72, d8: 0x73, e8: 0x74, f8: 0x75, g8: 0x76, h8: 0x77,
  a6: 0x50, b6: 0x51, c6: 0x52, d6: 0x53, e6: 0x54, f6: 0x55, g6: 0x56, h6: 0x57,
  a7: 0x60, b7: 0x61, c7: 0x62, d7: 0x63, e7: 0x64, f7: 0x65, g7: 0x66, h7: 0x67,
};

export const X88_TO_SQUARE: Record<number, Square> = {
  0x00: 'a1', 0x01: 'b1', 0x02: 'c1', 0x03: 'd1', 0x04: 'e1', 0x05: 'f1', 0x06: 'g1', 0x07: 'h1',
  0x10: 'a2', 0x11: 'b2', 0x12: 'c2', 0x13: 'd2', 0x14: 'e2', 0x15: 'f2', 0x16: 'g2', 0x17: 'h2',
  0x20: 'a3', 0x21: 'b3', 0x22: 'c3', 0x23: 'd3', 0x24: 'e3', 0x25: 'f3', 0x26: 'g3', 0x27: 'h3',
  0x30: 'a4', 0x31: 'b4', 0x32: 'c4', 0x33: 'd4', 0x34: 'e4', 0x35: 'f4', 0x36: 'g4', 0x37: 'h4',
  0x40: 'a5', 0x41: 'b5', 0x42: 'c5', 0x43: 'd5', 0x44: 'e5', 0x45: 'f5', 0x46: 'g5', 0x47: 'h5',
  0x50: 'a6', 0x51: 'b6', 0x52: 'c6', 0x53: 'd6', 0x54: 'e6', 0x55: 'f6', 0x56: 'g6', 0x57: 'h6',
  0x60: 'a7', 0x61: 'b7', 0x62: 'c7', 0x63: 'd7', 0x64: 'e7', 0x65: 'f7', 0x66: 'g7', 0x67: 'h7',
  0x70: 'a8', 0x71: 'b8', 0x72: 'c8', 0x73: 'd8', 0x74: 'e8', 0x75: 'f8', 0x76: 'g8', 0x77: 'h8',
};

export function getRank(square: number): number {
  return square >> 4;
}

export function getFile(square: number): number {
  return square & 0xf;
}

export enum Color {
  WHITE = 'white',
  BLACK = 'black',
}

export enum CastleSide {
  KINGSIDE = 'kingside',
  QUEENSIDE = 'queenside',
}

export enum MoveType {
  CAPTURE = 'standard capture',
  EN_PASSANT = 'en passant',
  KINGSIDE_CASTLE = 'kingside castle',
  QUEENSIDE_CASTLE = 'queenside castle',
  STANDARD_MOVE = 'standard move',
}

export enum GameOverType {
  WHITE_WIN = 'w',
  BLACK_WIN = 'b',
  DRAW = 'd',
  STALEMATE = 's',
}

export enum Flag {
  PROMOTION = 'promotion',
  DOUBLE = 'double',
  PAWN_MOVE = 'pawn move',
  CAPTURE = 'capture',
  DISABLE_BLACK_QUEENSIDE_CASTLING = 'disable black queenside castling',
  DISABLE_BLACK_KINGSIDE_CASTLING = 'disable black kingside castling',
  DISABLE_WHITE_QUEENSIDE_CASTLING = 'disable white queenside castling',
  DISABLE_WHITE_KINGSIDE_CASTLING = 'disable white kingside castling',
}

export enum PieceType {
  KING = 'K',
  QUEEN = 'Q',
  BISHOP = 'B',
  KNIGHT = 'N',
  ROOK = 'R',
  PAWN = 'P'
}

export interface Move {
  from: Square,
  to: Square,
}

export interface MoveResult {
  color: Color;
  from: Square;
  to: Square;
  piece: Piece;
  result: Chessboard;
  moveType: MoveType;
  captures: Square[],
  explode: boolean,
  enPassantTarget?: Square,
  flags: { [key in Flag]?: boolean },
}

// Define the structure for a castling move, including the movement of the king, rook, and squares between them.
export interface CastleMove {
  kingMove: Move; // Move of the king
  rookMove: Move; // Move of the rook
  between: Square[]; // Squares between the king and rook
}

// Define the possible chess squares
export type Square =
  'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8' |
  'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7' |
  'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6' |
  'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5' |
  'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4' |
  'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3' |
  'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2' |
  'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1';

// Define possible chess piece options when promoting pawns
export type PromotablePiece = 'Q' | 'q' | 'B' | 'b' | 'N' | 'n' | 'R' | 'r';

// Define possible chess pieces
export type Piece =
  'k' | 'q' | 'b' | 'n' | 'r' | 'p' |
  'K' | 'Q' | 'B' | 'N' | 'R' | 'P';

// Define the structure of a Chessboard
export type Chessboard = Record<Square, Piece | null>;

// Define the structure for castling rights
export type CastlingRights = Record<Color, Record<CastleSide, boolean>>;

// Define the structure for FEN (Forsyth–Edwards Notation) of the state of a chess game
export type FEN = {
  board: Chessboard, // Chess position
  activeColor: Color, // Color of the current player
  hasCastlingRights: CastlingRights, // Castling rights for both players
  enPassantTargets: Square[], // Squares where en passant captures are possible
  halfMoves: number, // Increments when a player moves and resets to 0 when a capture occurs or pawn advances
  fullMoves: number, // Increments when both players have completed a move
}

// Map pieces to piece color
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

// Map pieces to piece type
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
  dirs: number[],
}

const PIECE_MOVE_PATTERNS: Record<Piece, MovePattern> = {
  k: { steps: 1, dirs: [-17, -16, -15, 1, 17, 16, 15, -1] },
  q: { steps: 7, dirs: [-17, -16, -15, 1, 17, 16, 15, -1] },
  b: { steps: 7, dirs: [-17, -15, 17, 15] },
  n: { steps: 1, dirs: [-18, -33, -31, -14, 18, 33, 31, 14] },
  r: { steps: 7, dirs: [-16, 1, 16, -1] },
  p: { steps: 1, dirs: [-16] },
  K: { steps: 1, dirs: [-17, -16, -15, 1, 17, 16, 15, -1] },
  Q: { steps: 7, dirs: [-17, -16, -15, 1, 17, 16, 15, -1] },
  B: { steps: 7, dirs: [-17, -15, 17, 15] },
  N: { steps: 1, dirs: [-18, -33, -31, -14, 18, 33, 31, 14] },
  R: { steps: 7, dirs: [-16, 1, 16, -1] },
  P: { steps: 1, dirs: [16] },
};

const PIECE_CAPTURE_PATTERNS: Record<Piece, MovePattern> = {
  k: { steps: 1, dirs: [-17, -16, -15, 1, 17, 16, 15, -1] },
  q: { steps: 7, dirs: [-17, -16, -15, 1, 17, 16, 15, -1] },
  b: { steps: 7, dirs: [-17, -15, 17, 15] },
  n: { steps: 1, dirs: [-18, -33, -31, -14, 18, 33, 31, 14] },
  r: { steps: 7, dirs: [-16, 1, 16, -1] },
  p: { steps: 1, dirs: [-17, -15] },
  K: { steps: 1, dirs: [-17, -16, -15, 1, 17, 16, 15, -1] },
  Q: { steps: 7, dirs: [-17, -16, -15, 1, 17, 16, 15, -1] },
  B: { steps: 7, dirs: [-17, -15, 17, 15] },
  N: { steps: 1, dirs: [-18, -33, -31, -14, 18, 33, 31, 14] },
  R: { steps: 7, dirs: [-16, 1, 16, -1] },
  P: { steps: 1, dirs: [15, 17] },
};

// Map player colors to castles
export const CASTLE_MOVES: Record<Color, { kingside: CastleMove, queenside: CastleMove }> = {
  [Color.WHITE]: {
    kingside: { kingMove: { from: 'e1', to: 'g1' }, rookMove: { from: 'h1', to: 'f1' }, between: ['f1', 'g1'] },
    queenside: { kingMove: { from: 'e1', to: 'c1' }, rookMove: { from: 'a1', to: 'd1' }, between: ['d1', 'c1', 'b1'] },
  },
  [Color.BLACK]: {
    kingside: { kingMove: { from: 'e8', to: 'g8' }, rookMove: { from: 'h8', to: 'f8' }, between: ['f8', 'g8'] },
    queenside: { kingMove: { from: 'e8', to: 'c8' }, rookMove: { from: 'a8', to: 'd8' }, between: ['d8', 'c8', 'b8'] },
  },
};

// Store promotion squares for pawns of each color
export const PROMOTION_SQUARES: Record<Color, Square[]> = {
  [Color.WHITE]: ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'],
  [Color.BLACK]: ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1']
};

// Map player colors to opposite player colors
export const ENEMY_COLOR: Record<Color, Color> = {
  [Color.WHITE]: Color.BLACK,
  [Color.BLACK]: Color.WHITE
};

// Store double moves for pawns of each color
export const PAWN_DOUBLE_MOVES: Record<Color, { [key: string]: { from: Square; between: Square; to: Square } }> = {
  [Color.WHITE]: {
    'a2': { from: 'a2', between: 'a3', to: 'a4' },
    'b2': { from: 'b2', between: 'b3', to: 'b4' },
    'c2': { from: 'c2', between: 'c3', to: 'c4' },
    'd2': { from: 'd2', between: 'd3', to: 'd4' },
    'e2': { from: 'e2', between: 'e3', to: 'e4' },
    'f2': { from: 'f2', between: 'f3', to: 'f4' },
    'g2': { from: 'g2', between: 'g3', to: 'g4' },
    'h2': { from: 'h2', between: 'h3', to: 'h4' }
  },
  [Color.BLACK]: {
    'a7': { from: 'a7', between: 'a6', to: 'a5' },
    'b7': { from: 'b7', between: 'b6', to: 'b5' },
    'c7': { from: 'c7', between: 'c6', to: 'c5' },
    'd7': { from: 'd7', between: 'd6', to: 'd5' },
    'e7': { from: 'e7', between: 'e6', to: 'e5' },
    'f7': { from: 'f7', between: 'f6', to: 'f5' },
    'g7': { from: 'g7', between: 'g6', to: 'g5' },
    'h7': { from: 'h7', between: 'h6', to: 'h5' }
  }
};

// Store pieces that pawns of each color can promote to
export const PROMOTABLE_PIECES: Record<Color, PromotablePiece[]> = {
  [Color.WHITE]: ['Q', 'N', 'R', 'B'],
  [Color.BLACK]: ['q', 'n', 'r', 'b']
};

// Define initial chess position of a chess game
export const INITIAL_CHESSBOARD_POSITION: Record<Square, Piece | null> = {
  a8: 'r', b8: 'n', c8: 'b', d8: 'q', e8: 'k', f8: 'b', g8: 'n', h8: 'r',
  a7: 'p', b7: 'p', c7: 'p', d7: 'p', e7: 'p', f7: 'p', g7: 'p', h7: 'p',
  a6: null, b6: null, c6: null, d6: null, e6: null, f6: null, g6: null, h6: null,
  a5: null, b5: null, c5: null, d5: null, e5: null, f5: null, g5: null, h5: null,
  a4: null, b4: null, c4: null, d4: null, e4: null, f4: null, g4: null, h4: null,
  a3: null, b3: null, c3: null, d3: null, e3: null, f3: null, g3: null, h3: null,
  a2: 'P', b2: 'P', c2: 'P', d2: 'P', e2: 'P', f2: 'P', g2: 'P', h2: 'P',
  a1: 'R', b1: 'N', c1: 'B', d1: 'Q', e1: 'K', f1: 'B', g1: 'N', h1: 'R',
};

// Define initial castling rights of a chess game
export const INITIAL_CASTLING_RIGHTS: CastlingRights = {
  [Color.WHITE]: { [CastleSide.KINGSIDE]: true, [CastleSide.QUEENSIDE]: true },
  [Color.BLACK]: { [CastleSide.KINGSIDE]: true, [CastleSide.QUEENSIDE]: true }
};

// Define FEN representation of initial state of a chess game
export const INITIAL_GAMESTATE: FEN = {
  activeColor: Color.WHITE,
  board: INITIAL_CHESSBOARD_POSITION,
  hasCastlingRights: INITIAL_CASTLING_RIGHTS,
  enPassantTargets: [],
  halfMoves: 0,
  fullMoves: 0
};

// Define array of all chessboard squares
export const CHESSBOARD_SQUARES: Square[] = Object.keys(SQUARE_TO_X88) as Square[];

export function moveSquare(square: Square, offset: number): Square | null {
  return X88_TO_SQUARE[SQUARE_TO_X88[square] + offset] ?? null;
}

const ADJ_SQUARES: number[] = [-17, -16, -15, 1, 17, 16, 15, -1];

// Function to get all valid moves for the current game state
export function hasLegalMoves(gameState: FEN): boolean {
  return CHESSBOARD_SQUARES.some(from => getLegalMovesFrom(gameState, from).length > 0);
}

// Function to check if the current player is in checkmate
export function isCheckmate(gameState: FEN, activeColor: Color): boolean {
  return isCheck(gameState.board, activeColor) && !hasLegalMoves(gameState);
}

// Function to check if the game is in stalemate
export function isStalemate(gameState: FEN, activeColor: Color): boolean {
  return !isCheck(gameState.board, activeColor) && !hasLegalMoves(gameState) && findKing(gameState.board, activeColor) != null;
}

// Function to check if a pawn at a given square can be promoted
export function canPromotePawnAt(board: Chessboard, square: Square): boolean {
  const piece = board[square];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN) return false;
  return PROMOTION_SQUARES[PIECE_TO_COLOR[piece]].includes(square);
}

export function getLegalMovesFrom(gameState: FEN, from: Square): MoveResult[] {
  return getMovesFrom(gameState, from).filter(({ result, color }) => isLegalPosition(result, color));
}

function getMovesFrom(gameState: FEN, from: Square): MoveResult[] {
  return [
    ...getCastlesFrom(gameState, CastleSide.KINGSIDE, from),
    ...getCastlesFrom(gameState, CastleSide.QUEENSIDE, from),
    ...getDoubleMovesFrom(gameState, from),
    ...getEnPassantsFrom(gameState, from),
    ...getCapturesFrom(gameState, from),
    ...getStandardMovesFrom(gameState, from),
  ];
}

// Function to get valid standard captures from a given square
function getCapturesFrom(gameState: FEN, from: Square): MoveResult[] {
  const { board, activeColor } = gameState;
  const piece = board[from];
  if (!piece || PIECE_TO_COLOR[piece] != activeColor) return [];
  const { dirs, steps } = PIECE_CAPTURE_PATTERNS[piece];
  return dirs.flatMap(dir => getRayMove(board, from, dir, steps).last ?? [])
    .filter(square => {
      const pieceFound = board[square];
      return pieceFound && PIECE_TO_COLOR[pieceFound] == ENEMY_COLOR[activeColor];
    })
    .map(to => {
      const result = structuredClone(board);
      explodeSquare(result, from);
      const captures = [to, ...getSurroundingExplosions(result, to)];
      captures.forEach(square => explodeSquare(result, square));
      return ({
        from: from,
        to: to,
        piece: piece,
        flags: {
          [Flag.CAPTURE]: true,
          [Flag.DISABLE_BLACK_KINGSIDE_CASTLING]: captures.some(square => board[square] == 'r' && from == CASTLE_MOVES[Color.BLACK][CastleSide.KINGSIDE].rookMove.from),
          [Flag.DISABLE_BLACK_QUEENSIDE_CASTLING]: captures.some(square => board[square] == 'r' && from == CASTLE_MOVES[Color.BLACK][CastleSide.QUEENSIDE].rookMove.from),
          [Flag.DISABLE_WHITE_KINGSIDE_CASTLING]: captures.some(square => board[square] == 'R' && from == CASTLE_MOVES[Color.WHITE][CastleSide.KINGSIDE].rookMove.from),
          [Flag.DISABLE_WHITE_QUEENSIDE_CASTLING]: captures.some(square => board[square] == 'R' && from == CASTLE_MOVES[Color.WHITE][CastleSide.QUEENSIDE].rookMove.from),
        },
        color: activeColor,
        moveType: MoveType.CAPTURE,
        captures: captures,
        explode: true,
        result: result,
      });
    });
}

// Function to get valid standard moves from a given square
function getStandardMovesFrom(gameState: FEN, from: Square): MoveResult[] {
  const { board, activeColor } = gameState;
  const piece = board[from];
  if (!piece || PIECE_TO_COLOR[piece] != activeColor) return [];
  const { dirs, steps } = PIECE_MOVE_PATTERNS[piece];
  return dirs.flatMap(dir => getRayMove(board, from, dir, steps).between)
    .map(to => {
      const result = structuredClone(board);
      movePiece(result, { from: from, to: to });
      return ({
        from: from,
        to: to,
        piece: piece,
        flags: {
          [Flag.PAWN_MOVE]: piece == PieceType.PAWN,
          [Flag.DISABLE_BLACK_KINGSIDE_CASTLING]: piece == 'k' || (piece == 'r' && from == CASTLE_MOVES[Color.BLACK][CastleSide.KINGSIDE].rookMove.from),
          [Flag.DISABLE_BLACK_QUEENSIDE_CASTLING]: piece == 'k' || (piece == 'r' && from == CASTLE_MOVES[Color.BLACK][CastleSide.QUEENSIDE].rookMove.from),
          [Flag.DISABLE_WHITE_KINGSIDE_CASTLING]: piece == 'K' || (piece == 'R' && from == CASTLE_MOVES[Color.WHITE][CastleSide.KINGSIDE].rookMove.from),
          [Flag.DISABLE_WHITE_QUEENSIDE_CASTLING]: piece == 'K' || (piece == 'R' && from == CASTLE_MOVES[Color.WHITE][CastleSide.QUEENSIDE].rookMove.from),
          [Flag.PROMOTION]: canPromotePawnAt(result, to),
        },
        color: activeColor,
        moveType: MoveType.STANDARD_MOVE,
        result: result,
        explode: false,
        captures: [],
      });
    });
}

// Function to get valid double moves from a given square
function getDoubleMovesFrom({ board, activeColor }: FEN, from: Square): MoveResult[] {
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN || PIECE_TO_COLOR[piece] != activeColor) return [];
  if (!(from in PAWN_DOUBLE_MOVES[activeColor])) return [];
  const { between, to } = PAWN_DOUBLE_MOVES[activeColor][from];
  if (board[between] || board[to]) return [];
  const result = structuredClone(board);
  movePiece(result, { from: from, to: to });
  return [{
    from: from,
    to: to,
    piece: piece,
    flags: { [Flag.DOUBLE]: true },
    color: activeColor,
    moveType: MoveType.STANDARD_MOVE,
    result: result,
    explode: false,
    captures: [],
    enPassantTarget: between,
  }];
}

// Function to get valid en passant moves from a given square
function getEnPassantsFrom({ board, activeColor, enPassantTargets }: FEN, from: Square): MoveResult[] {
  const piece = board[from];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN || PIECE_TO_COLOR[piece] != activeColor) return [];
  return PIECE_CAPTURE_PATTERNS[piece].dirs.flatMap(offset => moveSquare(from, offset) ?? [])
    .filter(to => enPassantTargets.includes(to))
    .map(to => {
      const result = structuredClone(board);
      const target = moveSquare(to, -PIECE_MOVE_PATTERNS[piece].dirs[0]) as Square;
      explodeSquare(result, from);
      const captures = [target, ...getSurroundingExplosions(result, to)];
      captures.forEach(square => explodeSquare(result, square));
      return ({
        from: from,
        to: to,
        piece: piece,
        flags: { [Flag.CAPTURE]: true },
        color: activeColor,
        moveType: MoveType.EN_PASSANT,
        result: result,
        captures: captures,
        explode: true,
      });
    });
}

function getCastlesFrom(gameState: FEN, castleSide: CastleSide, from: Square): MoveResult[] {
  const { board, activeColor, hasCastlingRights } = gameState;
  if (!hasCastlingRights[activeColor][castleSide] || isCheck(board, activeColor)) return [];
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
    flags: {
      [Flag.DISABLE_BLACK_KINGSIDE_CASTLING]: castleSide == CastleSide.KINGSIDE && activeColor == Color.BLACK,
      [Flag.DISABLE_BLACK_QUEENSIDE_CASTLING]: castleSide == CastleSide.QUEENSIDE && activeColor == Color.BLACK,
      [Flag.DISABLE_WHITE_KINGSIDE_CASTLING]: castleSide == CastleSide.KINGSIDE && activeColor == Color.WHITE,
      [Flag.DISABLE_WHITE_QUEENSIDE_CASTLING]: castleSide == CastleSide.QUEENSIDE && activeColor == Color.WHITE,
    },
    color: activeColor,
    moveType: castleSide == CastleSide.KINGSIDE ? MoveType.KINGSIDE_CASTLE : MoveType.QUEENSIDE_CASTLE,
    result: result,
    captures: [],
    explode: false,
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
  return ADJ_SQUARES.flatMap(offset => moveSquare(square, offset) ?? [])
    .filter(to => {
      const piece = board[to];
      return piece && PIECE_TO_TYPE[piece] != PieceType.PAWN;
    });
}

// Finds a specific piece on the board
function findPiece(board: Chessboard, piece: Piece): Square | null {
  return CHESSBOARD_SQUARES.find(key => board[key] == piece) ?? null;
}

// Finds the king of a specific color on the board
export function findKing(board: Chessboard, activeColor: Color): Square | null {
  return findPiece(board, activeColor == Color.WHITE ? 'K' : 'k');
}

// Checks if two squares are adjacent to each other
function isAdjacent(square1: Square, square2: Square) {
  return ADJ_SQUARES.includes(SQUARE_TO_X88[square1] - SQUARE_TO_X88[square2]);
}

// Checks if the specified player is in atomic check
function isCheck(board: Chessboard, activeColor: Color): boolean {
  const enemyColor = ENEMY_COLOR[activeColor];
  const kingPos = findKing(board, activeColor);
  const enemyKingPos = findKing(board, enemyColor);
  if (!kingPos || !enemyKingPos || isAdjacent(kingPos, enemyKingPos)) return false;

  const enemyPieceTypes = (Object.keys(PIECE_TO_COLOR) as Piece[]).filter(piece => PIECE_TO_COLOR[piece] == enemyColor);
  return enemyPieceTypes.some(piece => {
    const { dirs, steps } = PIECE_CAPTURE_PATTERNS[piece];
    return dirs.some(dir => {
      const square = getRayMove(board, kingPos, -dir, steps).last;
      return square && board[square] == piece;
    })
  });
}

// Checks if the atomic chess position causes the specified player to lose
function isLegalPosition(board: Chessboard, activeColor: Color): boolean {
  return findKing(board, activeColor) != null && !isCheck(board, activeColor);
}

// last returns null if the last square is off the board, otherwise it returns the square of the last piece it encountered
function getRayMove(board: Chessboard, from: Square, dir: number, steps: number): { between: Square[], last: Square | null } {
  const between: Square[] = [];
  for (let i = 1; i <= steps; i++) {
    const square = moveSquare(from, i * dir);
    if (!square) break;
    if (board[square]) return { between: between, last: square };
    between.push(square);
  }
  return { between: between, last: null };
}