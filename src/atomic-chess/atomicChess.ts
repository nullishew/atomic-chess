// Enumerate the possible colors of pieces
export enum Color {
  WHITE = 'white',
  BLACK = 'black',
}

// Enumerate the possible types of moves
export enum MoveType {
  CAPTURE = 'standard capture',
  EN_PASSANT = 'en passant',
  KINGSIDE_CASTLE = 'kingside castle',
  QUEENSIDE_CASTLE = 'queenside castle',
  STANDARD_MOVE = 'standard move',
}

// Enumerate the possible types of castling
export enum CastleType {
  KINGSIDE = 'kingside',
  QUEENSIDE = 'queenside',
}

// Enumerate the possible types of results when the game ends
export enum GameOverType {
  WHITE_WIN = 'w',
  BLACK_WIN = 'b',
  DRAW = 'd',
  STALEMATE = 's',
}

// Enumerate the possible types of chess pieces
export enum PieceType {
  KING = 'K',
  QUEEN = 'Q',
  BISHOP = 'B',
  KNIGHT = 'N',
  ROOK = 'R',
  PAWN = 'P'
}

// Define an interface for a move
export interface Move {
  from: Square,
  to: Square,
}

// Define the structure for a castling move, including the movement of the king, rook, and squares between them.
export interface CastleMove {
  kingMove: Move; // Move of the king
  rookMove: Move; // Move of the rook
  between: Square[]; // Squares between the king and rook
}

// Define the structure of a move pattern
export interface MovePattern {
  steps: number,
  patterns: SquareOffset[],
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

// Define the possible grid indices on a chessboard
type Index = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type SquareIndex = [Index, Index];

// Define the possible grid offsets of each move on a chessboard
type Offset = -7 | -6 | -5 | -4 | -3 | -2 | -1 | Index;
export type SquareOffset = [Offset, Offset];

// Define a position on a grid
export type Pos = [number, number];

// Define possible chess piece options when promoting pawns
export type PromotablePiece = 'Q' | 'q' | 'B' | 'b' | 'N' | 'n' | 'R' | 'r';

// Define possible chess pieces
export type Piece =
  'k' | 'q' | 'b' | 'n' | 'r' | 'p' |
  'K' | 'Q' | 'B' | 'N' | 'R' | 'P';

// Define the structure of a Chessboard
export type Chessboard = Record<Square, Piece | null>;

// Define the structure for castling rights
export type CastlingRights = Record<Color, Record<CastleType, boolean>>;

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

// Map chess squares to grid indices
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

// Define possible movement patterns
export const MOVE_PATTERNS: Record<string, SquareOffset[]> = {
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

// Map pieces to their standard movement patterns
export const PIECE_MOVE_PATTERNS: Record<Piece, MovePattern> = {
  K: { steps: 1, patterns: MOVE_PATTERNS.ALL },
  Q: { steps: 7, patterns: MOVE_PATTERNS.ALL },
  B: { steps: 7, patterns: MOVE_PATTERNS.DIAGONAL },
  N: { steps: 1, patterns: MOVE_PATTERNS.L_SHAPE },
  R: { steps: 7, patterns: MOVE_PATTERNS.PLUS_SHAPE },
  P: { steps: 1, patterns: [[1, 0]] },
  k: { steps: 1, patterns: MOVE_PATTERNS.ALL },
  q: { steps: 7, patterns: MOVE_PATTERNS.ALL },
  b: { steps: 7, patterns: MOVE_PATTERNS.DIAGONAL },
  n: { steps: 1, patterns: MOVE_PATTERNS.L_SHAPE },
  r: { steps: 7, patterns: MOVE_PATTERNS.PLUS_SHAPE },
  p: { steps: 1, patterns: [[-1, 0]] },
};

// Map pieces to their movement patterns when capturing pieces
export const PIECE_CAPTURE_PATTERNS: Record<Piece, MovePattern> = {
  K: { steps: 0, patterns: MOVE_PATTERNS.ALL },
  Q: { steps: 7, patterns: MOVE_PATTERNS.ALL },
  B: { steps: 7, patterns: MOVE_PATTERNS.DIAGONAL },
  N: { steps: 1, patterns: MOVE_PATTERNS.L_SHAPE },
  R: { steps: 7, patterns: MOVE_PATTERNS.PLUS_SHAPE },
  P: { steps: 1, patterns: [[1, -1], [1, 1]] },
  k: { steps: 0, patterns: MOVE_PATTERNS.ALL },
  q: { steps: 7, patterns: MOVE_PATTERNS.ALL },
  b: { steps: 7, patterns: MOVE_PATTERNS.DIAGONAL },
  n: { steps: 1, patterns: MOVE_PATTERNS.L_SHAPE },
  r: { steps: 7, patterns: MOVE_PATTERNS.PLUS_SHAPE },
  p: { steps: 1, patterns: [[-1, -1], [-1, 1]] }
};

// Map player colors to castles
export const CASTLE_MOVES: Record<Color, { kingside: CastleMove, queenside: CastleMove }> = {
  [Color.WHITE]: {
    kingside: {
      kingMove: { from: 'e1', to: 'g1' },
      rookMove: { from: 'h1', to: 'f1' },
      between: ['f1', 'g1'],
    },
    queenside: {
      kingMove: { from: 'e1', to: 'c1' },
      rookMove: { from: 'a1', to: 'd1' },
      between: ['d1', 'c1', 'b1'],
    },
  },
  [Color.BLACK]: {
    kingside: {
      kingMove: { from: 'e8', to: 'g8' },
      rookMove: { from: 'h8', to: 'f8' },
      between: ['f8', 'g8'],
    },
    queenside: {
      kingMove: { from: 'e8', to: 'c8' },
      rookMove: { from: 'a8', to: 'd8' },
      between: ['d8', 'c8', 'b8'],
    },
  },
};

// Store promotion squares for pawns of each color
export const PROMOTION_SQUARES: Record<Color, Square[]> = {
  [Color.WHITE]: ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'],
  [Color.BLACK]: ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1']
}

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
  [Color.WHITE]: { [CastleType.KINGSIDE]: true, [CastleType.QUEENSIDE]: true },
  [Color.BLACK]: { [CastleType.KINGSIDE]: true, [CastleType.QUEENSIDE]: true }
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
export const CHESSBOARD_SQUARES: Square[] = Object.keys(SQUARE_TO_INDEX) as Square[];

// Returns the opposite player color of the given color
export function getEnemyColor(color: Color): Color {
  return color == Color.WHITE ? Color.BLACK : Color.WHITE;
}

// Converts a grid index to the corresponding square or null if there is no square at the given index
export function gridIndexToSquare(index: Pos): Square | null {
  const [r, f] = index;
  if (r < 0 || r > 7 || f < 0 || f > 7) return null;
  return squareIndexToSquare(index as SquareIndex);
}

// Converts a square index to the corresponding square
export function squareIndexToSquare([r, f]: SquareIndex): Square {
  return 'abcdefgh'[f] + '12345678'[r] as Square;
}

// Moves a square by a given offset
export function moveSquare(square: Square, [dr, dc]: SquareOffset, steps: number = 1): Square | null {
  const [r, c] = SQUARE_TO_INDEX[square];
  return gridIndexToSquare([r + steps * dr, c + steps * dc]);
}