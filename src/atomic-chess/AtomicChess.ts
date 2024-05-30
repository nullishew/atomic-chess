// Define the player and chess piece colors
export enum Color {
  WHITE = 'white',
  BLACK = 'black',
}

// Define the possible piece types
export enum PieceType {
  KING = 'K',
  QUEEN = 'Q',
  BISHOP = 'B',
  KNIGHT = 'N',
  ROOK = 'R',
  PAWN = 'P',
}

// Define possible flags that could be raised in a chess game that would require the game state to be updated
export enum Flag {
  PROMOTION = 'promotion', // When a pawn reaches the other side of the board, it can be promoted to a queen, knight, bishop, or rook
  DOUBLE = 'double', // When pawns move two squares on the first move, they become en passant targets
  PAWN_MOVE = 'pawn move', // Moving a pawn resets the halfmove clock
  CAPTURE = 'capture', // Capturing a piece resets the halfmove clock
  DISABLE_BLACK_QUEENSIDE_CASTLING = 'disable black queenside castling', // When the A8 black rook is captured or moves, black can no longer castle queenside
  DISABLE_BLACK_KINGSIDE_CASTLING = 'disable black kingside castling', // When the H8 black rook is captured or moves, black can no longer castle kingside
  DISABLE_WHITE_QUEENSIDE_CASTLING = 'disable white queenside castling', // When the A1 white rook is captured or moves, white can no longer castle queenside
  DISABLE_WHITE_KINGSIDE_CASTLING = 'disable white kingside castling', // When the H8 white rook is captured or moves, white can no longer castle kingside
}

// Define possible ways to end the game
export enum GameOverType {
  WHITE_WIN = 'w',
  BLACK_WIN = 'b',
  DRAW = 'd',
  STALEMATE = 's',
}

// Define possible chess moves
export enum MoveType {
  CAPTURE = 'standard capture',
  EN_PASSANT = 'en passant',
  KINGSIDE_CASTLE = 'kingside castle',
  QUEENSIDE_CASTLE = 'queenside castle',
  STANDARD_MOVE = 'standard move',
}

// Define possible types of castling
export type CastleType = MoveType.KINGSIDE_CASTLE | MoveType.QUEENSIDE_CASTLE;

// Define structure for passing information about the result of a move outside of the validator
export interface MoveResult {
  color: Color;
  from: number;
  to: number;
  piece: Piece;
  result: Chessboard;
  type: MoveType;
  captures?: number[],
  explode?: boolean,
  enPassantSquare?: number,
  flags?: { [key in Flag]?: boolean },
}

// Define structure for passing information about the result of a move within the validator
interface InternalMove {
  board: Chessboard,
  from: number,
  to: number,
  piece: Piece,
  color: Color,
  type: MoveType,
  flags?: { [key in Flag]?: boolean },
  enPassantSquare?: number,
}

// Define the possible chess squares in algebraic notation
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

// Define the structure for castling rights
export type CastlingRights = Record<Color, Record<CastleType, boolean>>;

// Define the structure for FEN (Forsyth–Edwards Notation) of the state of a chess game
export type FEN = {
  board: Chessboard, // Chess position
  activeColor: Color, // Color of the current player
  hasCastlingRights: CastlingRights, // Castling rights for both players
  enPassantTarget: number | null, // Squares where en passant captures are possible
  halfMoves: number, // Increments when a player moves and resets to 0 when a capture occurs or pawn advances
  fullMoves: number, // Increments when both players have completed a move
}

/**
 * This chess validator uses some aspects of the 0x88 chessboard representation
 * The chessboard is represented with an array of 128 elements with 8 squares and 8 guard cells for each of 16 rows
 * This allows each square is represented as an 8 bit number (eg. h8 = 01110111) where
 * bits 1 - 3 represent the file, if the 4th bit is flipped, the square has an invalid file
 * bits 4 - 6 represent the rank, if the 8th bit is flipped, the square has an invalid rank
 * This makes it easy to add offsets to squares for piece movement and also perform off the board checks with bitwise operations
 */

// Maps chess squares in algebraic notation to 0x88 squares
export const X88: Record<Square, number> = {
  a1: 0x00, b1: 0x01, c1: 0x02, d1: 0x03, e1: 0x04, f1: 0x05, g1: 0x06, h1: 0x07,
  a2: 0x10, b2: 0x11, c2: 0x12, d2: 0x13, e2: 0x14, f2: 0x15, g2: 0x16, h2: 0x17,
  a3: 0x20, b3: 0x21, c3: 0x22, d3: 0x23, e3: 0x24, f3: 0x25, g3: 0x26, h3: 0x27,
  a4: 0x30, b4: 0x31, c4: 0x32, d4: 0x33, e4: 0x34, f4: 0x35, g4: 0x36, h4: 0x37,
  a5: 0x40, b5: 0x41, c5: 0x42, d5: 0x43, e5: 0x44, f5: 0x45, g5: 0x46, h5: 0x47,
  a6: 0x50, b6: 0x51, c6: 0x52, d6: 0x53, e6: 0x54, f6: 0x55, g6: 0x56, h6: 0x57,
  a7: 0x60, b7: 0x61, c7: 0x62, d7: 0x63, e7: 0x64, f7: 0x65, g7: 0x66, h7: 0x67,
  a8: 0x70, b8: 0x71, c8: 0x72, d8: 0x73, e8: 0x74, f8: 0x75, g8: 0x76, h8: 0x77,
};

// Maps 0x88 squares to chess squares in algebraic notation
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

// Map player colors to opposite player colors
export const ENEMY_COLOR: Record<Color, Color> = {
  [Color.WHITE]: Color.BLACK,
  [Color.BLACK]: Color.WHITE
};

// Define the ranks on the chessboard for each player starting from their side
export const RANKS: Record<Color, { second: number, last: number }> = {
  [Color.WHITE]: { second: 1, last: 7 },
  [Color.BLACK]: { second: 6, last: 0 },
};

// Define the algebraic notation for each color of each piece
export const KINGS: Record<Color, Piece> = { [Color.WHITE]: 'K', [Color.BLACK]: 'k' };
export const ROOKS: Record<Color, Piece> = { [Color.WHITE]: 'R', [Color.BLACK]: 'r' };
export const PAWNS: Record<Color, Piece> = { [Color.WHITE]: 'P', [Color.BLACK]: 'p' };

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
  P: Color.WHITE,
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
  P: PieceType.PAWN,
};

// Define common types of offset patterns on a chessboard
export const OFFSETS: Record<string, number[]> = {
  all: [-17, -16, -15, 1, 17, 16, 15, -1], // includes all adjacent squares
  cross: [-16, 1, 16, -1], // includes horizontally and vertically adjacent squares
  l: [-18, -33, -31, -14, 18, 33, 31, 14], // "L" shape movement of the knight, 2 squares in direction and 1 square in another
  diagonal: [-17, -15, 17, 15], // includes diagonally adjacent squares
};

// Maps pieces to their corresponding movement patterns
export const PIECE_MOVE_PATTERNS: Record<Piece, number[]> = {
  k: OFFSETS.all,
  q: OFFSETS.all,
  b: OFFSETS.diagonal,
  n: OFFSETS.l,
  r: OFFSETS.cross,
  p: [-16, -32],
  K: OFFSETS.all,
  Q: OFFSETS.all,
  B: OFFSETS.diagonal,
  N: OFFSETS.l,
  R: OFFSETS.cross,
  P: [16, 32],
};

// Maps pieces to their corresponding capture patterns
// In atomic chess (unlike normal chess), kings can't capture because this would blow up the king and result in an instant loss
export const PIECE_CAPTURE_PATTERNS: Record<Piece, number[]> = {
  k: [],
  q: OFFSETS.all,
  b: OFFSETS.diagonal,
  n: OFFSETS.l,
  r: OFFSETS.cross,
  p: [-17, -15],
  K: [],
  Q: OFFSETS.all,
  B: OFFSETS.diagonal,
  N: OFFSETS.l,
  R: OFFSETS.cross,
  P: [17, 15],
};

// In standard moves, kings, knights, and pawns only move once
export const MOVES_ONCE: Record<Piece, boolean> = {
  k: true,
  q: false,
  b: false,
  n: true,
  r: false,
  p: true,
  K: true,
  Q: false,
  B: false,
  N: true,
  R: false,
  P: true,
};

// Maps chess colors to chess pieces of that color
export const COLOR_TO_PIECES: Record<Color, Piece[]> = {
  [Color.WHITE]: ['K', 'Q', 'B', 'N', 'R', 'P'],
  [Color.BLACK]: ['k', 'q', 'b', 'n', 'r', 'p'],
};

// Maps chess colors to chess pieces a pawn of the color can promote to
export const PROMOTABLE_PIECES: Record<Color, PromotablePiece[]> = {
  [Color.WHITE]: ['Q', 'N', 'R', 'B'],
  [Color.BLACK]: ['q', 'n', 'r', 'b'],
};

// Map chess colors to castling moves
export const CASTLE_MOVES: Record<Color, Record<CastleType, { kingMove: { from: number, to: number }, rookMove: { from: number, to: number }, between: number[] }>> = {
  [Color.WHITE]: {
    [MoveType.KINGSIDE_CASTLE]: { kingMove: { from: X88.e1, to: X88.g1 }, rookMove: { from: X88.h1, to: X88.f1 }, between: [X88.f1, X88.g1] },
    [MoveType.QUEENSIDE_CASTLE]: { kingMove: { from: X88.e1, to: X88.c1 }, rookMove: { from: X88.a1, to: X88.d1 }, between: [X88.d1, X88.c1, X88.b1] },
  },
  [Color.BLACK]: {
    [MoveType.KINGSIDE_CASTLE]: { kingMove: { from: X88.e8, to: X88.g8 }, rookMove: { from: X88.h8, to: X88.f8 }, between: [X88.f8, X88.g8] },
    [MoveType.QUEENSIDE_CASTLE]: { kingMove: { from: X88.e8, to: X88.c8 }, rookMove: { from: X88.a8, to: X88.d8 }, between: [X88.d8, X88.c8, X88.b8] },
  },
};

// Define initial castling rights of a chess game
export const INITIAL_CASTLING_RIGHTS: CastlingRights = {
  [Color.WHITE]: { [MoveType.KINGSIDE_CASTLE]: true, [MoveType.QUEENSIDE_CASTLE]: true },
  [Color.BLACK]: { [MoveType.KINGSIDE_CASTLE]: true, [MoveType.QUEENSIDE_CASTLE]: true },
};

// Define the structure of a chessboard in the 0x88 chessboard representation, an array of size 128
export type Chessboard = (Piece | null)[];

// Define initial chess position of a chess game
export const INITIAL_X88CHESSBOARD_POSITION: Chessboard = [
  'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R', null, null, null, null, null, null, null, null,
  'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', null, null, null, null, null, null, null, null,
  'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r', null, null, null, null, null, null, null, null,
];

// Define FEN representation of initial state of a chess game
export const INITIAL_GAMESTATE: FEN = {
  activeColor: Color.WHITE,
  board: INITIAL_X88CHESSBOARD_POSITION,
  hasCastlingRights: INITIAL_CASTLING_RIGHTS,
  enPassantTarget: null,
  halfMoves: 0,
  fullMoves: 1
};

// Gets the rank of the specified 0x88 square
// In 0x88, 16 (2^4) numbers are used for each row (8 for the board, 8 as guard cells), so the bits starting from the 5th bit represent the row
export function getRank(square: number): number {
  return square >> 4;
}

// Gets the file of the specified 0x88 square
// In 0x88, the first three bits represent the file of a square, so masking a square with 7 (00000111 in binary) gets the file
export function getFile(square: number): number {
  return square & 7;
}

// Checks if the specified square is on the board
// Uses bitwise and with 0x88 (10001000 in binary) to check the 4th and 8th bits
// 4th bit flipped -> invalid file, 8th bit flipped -> invalid rank
// square & 0x88 will only be 0 if neither the 4th nor 8th bit are flipped
export function isValidSquare(square: number) {
  return (square & 0x88) == 0;
}

// Function to check if a pawn at a given square can be promoted
// A piece at a given square can be promoted if it is a pawn and it has reached the last rank (other side) of the board
export function canPromotePawnAt(board: Chessboard, square: number): boolean {
  const piece = board[square];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN) return false;
  return getRank(square) == RANKS[PIECE_TO_COLOR[piece]].last;
}

// Moves a piece from one square to another on a given chessboard
export function movePiece(board: Chessboard, { from, to }: { from: number, to: number }) {
  board[to] = board[from];
  board[from] = null;
}

// Explodes a piece at a given square on a given chessboard
export function explodePiece(board: Chessboard, square: number) {
  board[square] = null;
}

// Returns a list of surrounding squares that will explode given a target square being captured
// Adjacent squares will explode if they are not empty and are not pawns (exploding ally pieces is also possible)
export function getSurroundingExplosions(board: Chessboard, square: number): number[] {
  return OFFSETS.all.map(offset => square + offset)
    .filter(square => {
      const piece = board[square];
      return piece && PIECE_TO_TYPE[piece] != PieceType.PAWN;
    });
}

// Checks if the specified player is in atomic check
// A king is in check if it is attacked by another piece
// A king can't be in check if the two kings are adjacent because capturing it would blow up the other king as well
export function isCheck(board: Chessboard, color: Color): boolean {
  const kingIndex = board.indexOf(KINGS[color]);
  const enemyKingIndex = board.indexOf(KINGS[ENEMY_COLOR[color]]);
  if (kingIndex == -1 || enemyKingIndex == -1 || OFFSETS.all.includes(kingIndex - enemyKingIndex)) return false;
  return isAttacked(board, kingIndex, color);
}

// Checks if a square on a given chessboard is being attacked by a piece of a certain color
// For every enemy piece, this function will start from the given square and move backwards using the capture patterns of the piece
// If the correct enemy piece is found, the enemy piece is attacking the square
// kings can't capture, knights and pawns only move once when capturing
// ray pieces (bishop, queen, rook) can be blocked by other pieces in the way
export function isAttacked(board: Chessboard, square: number, color: Color): boolean {
  return COLOR_TO_PIECES[ENEMY_COLOR[color]].some(enemyPiece => PIECE_CAPTURE_PATTERNS[enemyPiece].some(dir => {
    let to = square - dir;
    while (isValidSquare(to)) {
      const foundPiece = board[to];
      if (foundPiece) return foundPiece == enemyPiece;
      if (MOVES_ONCE[enemyPiece]) return false;
      to -= dir;
    }
    return false;
  }));
}

// Class to keep track of the game state of an atomic chess game and validate moves
export class AtomicChess {
  board: Chessboard; // Keeps track of tthee chess position using the 0x88 representation
  activeColor: Color; // Current player color
  hasCastlingRights: CastlingRights; // Castling rights of each player
  enPassantSquare: number | null; // En passantable squares
  halfMoves: number; // Moves since last capture or pawn advance
  fullMoves: number; // Number of moves completed by each player

  history: string[] = [];
  positionCount: Record<string, number> = {};

  // Gets the FEN (Forsyth-Edwards Notation) of the current chess position excluding move counters
  getPositionFEN(): string {
    let position = '';
    for (let r = 7; r >= 0; r--) {
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const index = r * 16 + f;
        if (this.board[index]) {
          if (empty > 0) {
            position += empty;
            empty = 0;
          }
          position += this.board[index];
          continue;
        }
        empty++;
      }
      if (empty > 0) {
        position += empty;
      }
      if (r == 0) break;
      position += '/';
    }
    return position;
  }

  // Gets the FEN (Forsyth-Edwards Notation) of the current chess position
  getFEN(): string {
    const position = this.getPositionFEN();
    const activeColor = this.activeColor == Color.WHITE ? 'w' : 'b';
    let castlingRights = '';
    if (this.hasCastlingRights[Color.WHITE][MoveType.KINGSIDE_CASTLE]) {
      castlingRights += 'K';
    }
    if (this.hasCastlingRights[Color.WHITE][MoveType.QUEENSIDE_CASTLE]) {
      castlingRights += 'Q';
    }
    if (this.hasCastlingRights[Color.BLACK][MoveType.KINGSIDE_CASTLE]) {
      castlingRights += 'k';
    }
    if (this.hasCastlingRights[Color.BLACK][MoveType.QUEENSIDE_CASTLE]) {
      castlingRights += 'q';
    }
    if (castlingRights == '') {
      castlingRights = '-';
    }
    const enPassant = this.enPassantSquare ? X88_TO_SQUARE[this.enPassantSquare] + ' ' : '';
    return `${position} ${activeColor} ${castlingRights} ${enPassant}${this.halfMoves} ${this.fullMoves}`;
  }

  // Initializes the atomic chess game with the given state
  constructor(state: FEN) {
    this.load(state);
  }

  // Replaces the current game state with the given game state
  load(state: FEN) {
    Object.assign(this, state);
    this.addPositionToHistory();
  }

  // Increments the counter for the current position to be used to check for threefold repetition
  addPositionToHistory() {
    const position = this.getPositionFEN();
    this.history.push(position);
    this.positionCount[position] = (this.positionCount[position] ?? 0) + 1;
  }

  // Checks if the current player is able to move
  hasLegalMoves(): boolean {
    return (Object.keys(X88) as Square[]).some(from => this.getLegalMovesFrom(from).length > 0);
  }

  // Checks if the specified player has won either by checkmate or blowing up the enemy king so that it is no longer on the board
  isWin(activeColor: Color): boolean {
    return this.isCheckmate(ENEMY_COLOR[activeColor]) || this.board.indexOf(KINGS[ENEMY_COLOR[activeColor]]) == -1;
  }

  // Checks if the game is a checkmate when the enemy king is in check and can't move
  isCheckmate(color: Color): boolean {
    return isCheck(this.board, color) && !this.hasLegalMoves();
  }

  // Checks if the game is a stalemate when the enemy king is not in check and can't move
  isStalemate(): boolean {
    return !isCheck(this.board, this.activeColor) && !this.hasLegalMoves() && this.board.indexOf(KINGS[this.activeColor]) > -1;
  }

  // Checks if the game is a draw either by repetition or by failure to progress the game
  isDraw(): boolean {
    return this.isFiftyMoveDraw() || this.isThreeFoldRepetition();
  }

  // Checks if the current position has appeared at least 3 times
  isThreeFoldRepetition(): boolean {
    return (this.positionCount[this.getPositionFEN()] ?? 0) >= 3;
  }

  // Checks if it has been 50 moves since the last pawn moved or the last piece was captured
  isFiftyMoveDraw(): boolean {
    return this.halfMoves >= 50;
  }

  // Promotes a pawn at the given square to the given piece
  promote(square: Square, piece: PromotablePiece) {
    this.board[X88[square]] = piece;
  }

  // Switches turn after a move and updates game state accordingly
  switchTurn() {
    this.halfMoves++;
    // Full moves are counted when black moves
    if (this.activeColor == Color.BLACK) {
      this.fullMoves++;
    }
    this.activeColor = ENEMY_COLOR[this.activeColor];
    this.enPassantSquare = null; // Prevent en passants multiple moves after a pawn has moved two squares
  }

  // Updates the game state according to the flags raised in a move
  updateFlags({ enPassantSquare, flags }: MoveResult) {
    if (!flags) return;
    // Reset half moves
    if (flags[Flag.PAWN_MOVE] || flags[Flag.CAPTURE]) {
      this.halfMoves = 0;
    }
    // Update en passant square
    if (flags[Flag.DOUBLE] && enPassantSquare) {
      this.enPassantSquare = enPassantSquare;
    }
    // Update castling rights
    this.hasCastlingRights[Color.BLACK][MoveType.KINGSIDE_CASTLE] &&= !flags[Flag.DISABLE_BLACK_KINGSIDE_CASTLING];
    this.hasCastlingRights[Color.BLACK][MoveType.QUEENSIDE_CASTLE] &&= !flags[Flag.DISABLE_BLACK_QUEENSIDE_CASTLING];
    this.hasCastlingRights[Color.WHITE][MoveType.KINGSIDE_CASTLE] &&= !flags[Flag.DISABLE_WHITE_KINGSIDE_CASTLING];
    this.hasCastlingRights[Color.WHITE][MoveType.QUEENSIDE_CASTLE] &&= !flags[Flag.DISABLE_WHITE_QUEENSIDE_CASTLING];
  }

  // Validates a move, makes the move if it is legal, and returns the result of the move
  tryMove({ from, to }: { from: Square, to: Square }): MoveResult | null {
    const legalMove = this.getLegalMovesFrom(from).find(move => move.to == X88[to]);
    if (!legalMove) return null;
    this.switchTurn(); // Placed before updating flags to ensure the en passant square is not cleared after it is updated
    this.updateFlags(legalMove);
    this.board = legalMove.result;
    this.addPositionToHistory();
    return legalMove;
  }

  // Checks if the game has ended and if so, how
  tryGameOver(): GameOverType | null {
    if (this.isDraw()) return GameOverType.DRAW;
    if (this.isStalemate()) return GameOverType.STALEMATE;
    if (this.isWin(Color.WHITE)) return GameOverType.WHITE_WIN;
    if (this.isWin(Color.BLACK)) return GameOverType.BLACK_WIN;
    return null;
  }

  // Returns an array containing all the legal moves from the given square
  getLegalMovesFrom(square: Square): MoveResult[] {
    const from = X88[square];
    return [
      ...this.getCastlesFrom(MoveType.KINGSIDE_CASTLE, from),
      ...this.getCastlesFrom(MoveType.QUEENSIDE_CASTLE, from),
      ...this.getPawnCapturesFrom(from),
      ...this.getPawnMovesFrom(from),
      ...this.getStandardMovesFrom(from),
    ].filter(({ result, color }) => result.indexOf(KINGS[color]) > -1 && !isCheck(result, color));
  }

  // Finds the piece at the given position and checks for valid moves by moving in a ray for each of the valid directions
  // until the piece can no longer move, the piece is no longer on the board, or the piece is blocked. Then tries to capture
  // the piece at the square
  // pawns move in a unique manner
  // kings and knights move once
  // other pieces move in ray
  // kings can't capture
  getStandardMovesFrom(from: number): MoveResult[] {
    const piece = this.board[from];
    if (!piece || PIECE_TO_COLOR[piece] != this.activeColor) return [];
    if (PIECE_TO_TYPE[piece] == PieceType.PAWN) return []; // pawns moves are handled in a different function
    const dirs = PIECE_MOVE_PATTERNS[piece];
    const moves: MoveResult[] = [];
    for (const dir of dirs) {
      // try move in a ray
      let to = from + dir;
      while (isValidSquare(to) && !this.board[to]) {
        moves.push(getMoveResult({ board: this.board, from, to, piece, color: this.activeColor, type: MoveType.STANDARD_MOVE }));
        if (MOVES_ONCE[piece]) break;
        to += dir;
      }
      if (PIECE_TO_TYPE[piece] == PieceType.KING) continue; // king can't capture
      // try capture
      const foundPiece = this.board[to];
      if (!foundPiece || PIECE_TO_COLOR[foundPiece] != ENEMY_COLOR[this.activeColor]) continue;
      moves.push(getMoveResult({ board: this.board, from, to, piece, color: this.activeColor, type: MoveType.CAPTURE }));
    }
    return moves;
  }

  // Gets possible pawn captures from a given square
  // Pawns can either en passant or perform a standard capture
  getPawnCapturesFrom(from: number): MoveResult[] {
    const piece = this.board[from];
    if (piece != PAWNS[this.activeColor]) return [];
    const capturable = PIECE_CAPTURE_PATTERNS[piece].map(dir => from + dir);
    const captures = capturable.filter(to => {
      const found = this.board[to];
      return found && PIECE_TO_COLOR[found] == ENEMY_COLOR[this.activeColor];
    }).map(to => getMoveResult({ board: this.board, from, to, piece, color: this.activeColor, type: MoveType.CAPTURE }));
    if (!this.enPassantSquare || !capturable.includes(this.enPassantSquare)) return captures;
    const enPassant = getMoveResult({ board: this.board, from, to: this.enPassantSquare, piece, color: this.activeColor, type: MoveType.EN_PASSANT });
    return [...captures, enPassant];
  }

  // Gets possible pawn moves from a given square
  // Pawns can move once and can move twice if they have not yet moved
  getPawnMovesFrom(from: number): MoveResult[] {
    const piece = this.board[from];
    if (piece != PAWNS[this.activeColor]) return [];
    const [one, two] = PIECE_MOVE_PATTERNS[piece].map(dir => from + dir);
    if (!one || this.board[one]) return [];
    const firstMove = getMoveResult({ board: this.board, from, to: one, color: this.activeColor, piece, type: MoveType.STANDARD_MOVE });
    if (!two || this.board[two] || getRank(from) != RANKS[this.activeColor].second) return [firstMove];
    const secondMove = getMoveResult({ board: this.board, from, to: two, color: this.activeColor, piece, type: MoveType.STANDARD_MOVE, flags: { [Flag.DOUBLE]: true }, enPassantSquare: one });
    return [firstMove, secondMove];
  }

  // Gets possible castles of the given type from a given square
  // Castling is only possible when it is done from the original king position, the king has not moved, the rook being castled has not moved or been captured,
  // the king is not in check before or after castling, and none of the squares in between are attacked or are occupied
  getCastlesFrom(type: CastleType, from: number): MoveResult[] {
    const { kingMove, between, rookMove } = CASTLE_MOVES[this.activeColor][type];
    if (!this.hasCastlingRights[this.activeColor][type] || from != kingMove.from) return [];
    const king = this.board[kingMove.from];
    if (king != KINGS[this.activeColor] || this.board[rookMove.from] != ROOKS[this.activeColor]) return [];
    if (isCheck(this.board, this.activeColor) || between.some(square => this.board[square] || isAttacked(this.board, square, this.activeColor))) return [];
    return [getMoveResult({ board: this.board, from, to: kingMove.to, piece: king, color: this.activeColor, type })];
  }
}

// Returns the simulated result of a move
function getMoveResult({ board, from, to, color, piece, type, flags, enPassantSquare }: InternalMove): MoveResult {
  const result = structuredClone(board);
  let captures: number[] = [];
  let explode = false;
  flags ??= {};
  switch (type) {
    // Simulate castles
    case MoveType.KINGSIDE_CASTLE:
    case MoveType.QUEENSIDE_CASTLE:
      const { kingMove, rookMove } = CASTLE_MOVES[color][type];
      movePiece(result, kingMove);
      movePiece(result, rookMove);
      flags[Flag.DISABLE_BLACK_KINGSIDE_CASTLING] = color == Color.BLACK;
      flags[Flag.DISABLE_BLACK_QUEENSIDE_CASTLING] = color == Color.BLACK;
      flags[Flag.DISABLE_WHITE_KINGSIDE_CASTLING] = color == Color.WHITE;
      flags[Flag.DISABLE_WHITE_QUEENSIDE_CASTLING] = color == Color.WHITE;
      return { from, to, color, piece, type, flags, result };
    // Simulate standard moves
    case MoveType.STANDARD_MOVE:
      movePiece(result, { from, to });
      flags[Flag.PAWN_MOVE] = PIECE_TO_TYPE[piece] == PieceType.PAWN;
      flags[Flag.PROMOTION] = canPromotePawnAt(result, to);
      flags[Flag.DISABLE_BLACK_KINGSIDE_CASTLING] = piece == 'k' || (piece == 'r' && from == CASTLE_MOVES[Color.BLACK][MoveType.KINGSIDE_CASTLE].rookMove.from);
      flags[Flag.DISABLE_BLACK_QUEENSIDE_CASTLING] = piece == 'k' || (piece == 'r' && from == CASTLE_MOVES[Color.BLACK][MoveType.QUEENSIDE_CASTLE].rookMove.from);
      flags[Flag.DISABLE_WHITE_KINGSIDE_CASTLING] = piece == 'K' || (piece == 'R' && from == CASTLE_MOVES[Color.WHITE][MoveType.KINGSIDE_CASTLE].rookMove.from);
      flags[Flag.DISABLE_WHITE_QUEENSIDE_CASTLING] = piece == 'K' || (piece == 'R' && from == CASTLE_MOVES[Color.WHITE][MoveType.QUEENSIDE_CASTLE].rookMove.from);
      return { from, to, color, piece, type, flags, enPassantSquare, result };
    // Simulate captures and en passants
    case MoveType.CAPTURE:
    case MoveType.EN_PASSANT:
      const explodeTarget = type == MoveType.CAPTURE ? to : to - PIECE_MOVE_PATTERNS[piece][0];
      explodePiece(result, from);
      captures = [explodeTarget, ...getSurroundingExplosions(result, to)];
      captures.forEach(square => explodePiece(result, square));
      flags[Flag.CAPTURE] = true;
      flags[Flag.DISABLE_BLACK_KINGSIDE_CASTLING] = captures.some(square => board[square] == 'r' && from == CASTLE_MOVES[Color.BLACK][MoveType.KINGSIDE_CASTLE].rookMove.from);
      flags[Flag.DISABLE_BLACK_QUEENSIDE_CASTLING] = captures.some(square => board[square] == 'r' && from == CASTLE_MOVES[Color.BLACK][MoveType.QUEENSIDE_CASTLE].rookMove.from);
      flags[Flag.DISABLE_WHITE_KINGSIDE_CASTLING] = captures.some(square => board[square] == 'R' && from == CASTLE_MOVES[Color.WHITE][MoveType.KINGSIDE_CASTLE].rookMove.from);
      flags[Flag.DISABLE_WHITE_QUEENSIDE_CASTLING] = captures.some(square => board[square] == 'R' && from == CASTLE_MOVES[Color.WHITE][MoveType.QUEENSIDE_CASTLE].rookMove.from);
      explode = true;
      return { from, to, color, piece, type, flags, result, captures, explode };
    default:
      break;
  }
  // unreachable code added to satisfy the ts compiler
  return { from, to, color, piece, type, flags, enPassantSquare, result, captures, explode };
}
