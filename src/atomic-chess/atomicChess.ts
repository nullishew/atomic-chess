// Chess validator taking advantage of parts of the 0x88 chessboard representation

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

export type CastleType = MoveType.KINGSIDE_CASTLE | MoveType.QUEENSIDE_CASTLE;

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

export interface MoveResult {
  color: Color;
  from: number;
  to: number;
  piece: Piece;
  result: X88Chessboard;
  type: MoveType;
  captures?: number[],
  explode?: boolean,
  enPassantSquare?: number,
  flags?: { [key in Flag]?: boolean },
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

// Define the structure for castling rights
export type CastlingRights = Record<Color, Record<CastleType, boolean>>;

// Define the structure for FEN (Forsyth–Edwards Notation) of the state of a chess game
export type FEN = {
  board: X88Chessboard, // Chess position
  activeColor: Color, // Color of the current player
  hasCastlingRights: CastlingRights, // Castling rights for both players
  enPassantTarget: number | null, // Squares where en passant captures are possible
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

// Map player colors to castles
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

// Map player colors to opposite player colors
export const ENEMY_COLOR: Record<Color, Color> = {
  [Color.WHITE]: Color.BLACK,
  [Color.BLACK]: Color.WHITE
};

// Store pieces that pawns of each color can promote to
export const PROMOTABLE_PIECES: Record<Color, PromotablePiece[]> = {
  [Color.WHITE]: ['Q', 'N', 'R', 'B'],
  [Color.BLACK]: ['q', 'n', 'r', 'b']
};

// Define initial castling rights of a chess game
export const INITIAL_CASTLING_RIGHTS: CastlingRights = {
  [Color.WHITE]: { [MoveType.KINGSIDE_CASTLE]: true, [MoveType.QUEENSIDE_CASTLE]: true },
  [Color.BLACK]: { [MoveType.KINGSIDE_CASTLE]: true, [MoveType.QUEENSIDE_CASTLE]: true },
};

// Define the structure of a Chessboard
export type X88Chessboard = (Piece | null)[];

// Define initial chess position of a chess game
export const INITIAL_X88CHESSBOARD_POSITION: X88Chessboard = [
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

// Define array of all chessboard squares
export const CHESSBOARD_SQUARES: Square[] = Object.keys(X88) as Square[];

export const KINGS: Record<Color, Piece> = {
  [Color.WHITE]: 'K',
  [Color.BLACK]: 'k',
};

export const ROOKS: Record<Color, Piece> = {
  [Color.WHITE]: 'R',
  [Color.BLACK]: 'r',
};

export const PAWNS: Record<Color, Piece> = {
  [Color.WHITE]: 'P',
  [Color.BLACK]: 'p',
};

export const RANKS: Record<Color, { second: number, last: number }> = {
  [Color.WHITE]: { second: 1, last: 7 },
  [Color.BLACK]: { second: 6, last: 0 },
};

// Function to check if a pawn at a given square can be promoted
export function canPromotePawnAt(board: X88Chessboard, square: number): boolean {
  const piece = board[square];
  if (!piece || PIECE_TO_TYPE[piece] != PieceType.PAWN) return false;
  return getRank(square) == RANKS[PIECE_TO_COLOR[piece]].last;
}

// Moves a piece from one square to another
export function movePiece(board: X88Chessboard, { from, to }: { from: number, to: number }) {
  board[to] = board[from];
  board[from] = null;
}

// Explodes a piece at a given square
export function explodePiece(board: X88Chessboard, square: number) {
  board[square] = null;
}

// Returns a list of surrounding squares that will explode given a target square being captured
export function getSurroundingExplosions(board: X88Chessboard, square: number): number[] {
  return OFFSETS.all.map(offset => square + offset)
    .filter(square => {
      const piece = board[square];
      return piece && PIECE_TO_TYPE[piece] != PieceType.PAWN;
    });
}

// Checks if the specified player is in atomic check
export function isCheck(board: X88Chessboard, color: Color): boolean {
  const kingIndex = board.indexOf(KINGS[color]);
  const enemyKingIndex = board.indexOf(KINGS[ENEMY_COLOR[color]]);
  if (kingIndex == -1 || enemyKingIndex == -1 || OFFSETS.all.includes(kingIndex - enemyKingIndex)) return false;
  return isAttacked(board, kingIndex, color);
}

// finds square, moves backwards using the move directions of each piece until blocked, tries to find piece
// knight and pawn move once when capturing, king can't capture
export function isAttacked(board: X88Chessboard, square: number, color: Color): boolean {
  const enemyColor = ENEMY_COLOR[color];
  const enemyPieces = (Object.keys(PIECE_TO_COLOR) as Piece[]).filter(piece => PIECE_TO_COLOR[piece] == enemyColor);
  for (const enemyPiece of enemyPieces) {
    if (PIECE_TO_TYPE[enemyPiece] == PieceType.KING) continue;
    const movesOnce = 'NP'.includes(PIECE_TO_TYPE[enemyPiece]);
    let dirs = PIECE_MOVE_PATTERNS[enemyPiece];
    if (enemyPiece == 'P') {
      dirs = dirs.slice(2);
    }
    for (const dir of dirs) {
      let to = square - dir;
      while (!(to & 0x88)) {
        const foundPiece = board[to];
        if (foundPiece) {
          if (foundPiece == enemyPiece) return true;
          break;
        }
        if (movesOnce) break;
        to -= dir;
      }
    }
  }
  return false;
}

interface InternalMove {
  board: X88Chessboard,
  from: number,
  to: number,
  piece: Piece,
  color: Color,
  type: MoveType,
  flags?: { [key in Flag]?: boolean },
  enPassantSquare?: number,
}

export const OFFSETS: Record<string, number[]> = {
  all: [-17, -16, -15, 1, 17, 16, 15, -1],
  cross: [-16, 1, 16, -1],
  l: [-18, -33, -31, -14, 18, 33, 31, 14],
  diagonal: [-17, -15, 17, 15],
};

export const PIECE_MOVE_PATTERNS: Record<Piece, number[]> = {
  k: OFFSETS.all,
  q: OFFSETS.all,
  b: OFFSETS.diagonal,
  n: OFFSETS.l,
  r: OFFSETS.cross,
  p: [-16, -32, -17, -15],
  K: OFFSETS.all,
  Q: OFFSETS.all,
  B: OFFSETS.diagonal,
  N: OFFSETS.l,
  R: OFFSETS.cross,
  P: [16, 32, 17, 15],
};

export class AtomicChess {
  board: X88Chessboard;
  activeColor: Color;
  hasCastlingRights: CastlingRights;
  enPassantSquare: number | null; // why is this even an array if only one single pawn can move two squares in one move
  halfMoves: number;
  fullMoves: number;

  history: string[] = [];
  positionCount: Record<string, number> = {};

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

  constructor(state: FEN) {
    this.load(state);
  }

  load(state: FEN) {
    Object.assign(this, state);
    this.addPositionToHistory();
  }

  addPositionToHistory() {
    const position = this.getPositionFEN();
    this.history.push(position);
    this.positionCount[position] = (this.positionCount[position] ?? 0) + 1;
  }

  hasLegalMoves(): boolean {
    return CHESSBOARD_SQUARES.some(from => this.getLegalMovesFrom(from).length > 0);
  }
  isCheckmate(color: Color): boolean {
    return isCheck(this.board, color) && !this.hasLegalMoves();
  }
  isWin(activeColor: Color): boolean {
    return this.isCheckmate(ENEMY_COLOR[activeColor]) || this.board.indexOf(KINGS[ENEMY_COLOR[activeColor]]) == -1;
  }
  isStalemate(): boolean {
    return !isCheck(this.board, this.activeColor) && !this.hasLegalMoves() && this.board.indexOf(KINGS[this.activeColor]) > -1;
  }
  isDraw(): boolean {
    return this.isFiftyMoveDraw() || this.isThreeFoldRepetition();
  }
  isThreeFoldRepetition(): boolean {
    return (this.positionCount[this.getPositionFEN()] ?? 0) >= 3;
  }
  isFiftyMoveDraw(): boolean {
    return this.halfMoves >= 50;
  }

  promote(square: Square, piece: PromotablePiece) {
    this.board[X88[square]] = piece;
  }

  // Switches turn after a move and updates game state accordingly
  switchTurn() {
    this.halfMoves++;
    if (this.activeColor == Color.BLACK) {
      this.fullMoves++;
    }
    this.activeColor = ENEMY_COLOR[this.activeColor];
    this.enPassantSquare = null;
  }

  updateFlags({ enPassantSquare: enPassantTarget, flags }: MoveResult) {
    if (!flags) return;
    if (flags[Flag.PAWN_MOVE] || flags[Flag.CAPTURE]) {
      this.halfMoves = 0;
    }
    if (flags[Flag.DOUBLE] && enPassantTarget) {
      this.enPassantSquare = enPassantTarget;
    }
    this.hasCastlingRights[Color.BLACK][MoveType.KINGSIDE_CASTLE] &&= !flags[Flag.DISABLE_BLACK_KINGSIDE_CASTLING];
    this.hasCastlingRights[Color.BLACK][MoveType.QUEENSIDE_CASTLE] &&= !flags[Flag.DISABLE_BLACK_QUEENSIDE_CASTLING];
    this.hasCastlingRights[Color.WHITE][MoveType.KINGSIDE_CASTLE] &&= !flags[Flag.DISABLE_WHITE_KINGSIDE_CASTLING];
    this.hasCastlingRights[Color.WHITE][MoveType.QUEENSIDE_CASTLE] &&= !flags[Flag.DISABLE_WHITE_QUEENSIDE_CASTLING];
  }

  // Attempts to make a move on the board, updates the game state accordingly, and returns information about successful moves or null if it is not a valid move
  tryMove({ from, to }: { from: Square, to: Square }): MoveResult | null {
    const legalMove = this.getLegalMovesFrom(from).find(move => move.to == X88[to]);
    if (!legalMove) return null;
    this.switchTurn();
    this.updateFlags(legalMove);
    this.board = legalMove.result;
    this.addPositionToHistory();
    return legalMove;
  }

  // Checks if the game is over and returns the result
  tryGameOver(): GameOverType | null {
    if (this.isDraw()) return GameOverType.DRAW;
    if (this.isStalemate()) return GameOverType.STALEMATE;
    if (this.isWin(Color.WHITE)) return GameOverType.WHITE_WIN;
    if (this.isWin(Color.BLACK)) return GameOverType.BLACK_WIN;
    return null;
  }

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

  // pawns move in a weird way and are handled in a different function
  // other pieces move in one direction
  // kings and knights move once
  // all other pieces move in a ray until they are blocked or leave the board
  // kings can't capture
  getStandardMovesFrom(from: number): MoveResult[] {
    const piece = this.board[from];
    if (!piece || PIECE_TO_COLOR[piece] != this.activeColor) return [];
    if (PIECE_TO_TYPE[piece] == PieceType.PAWN) return []; // pawns are built different
    const dirs = PIECE_MOVE_PATTERNS[piece];
    const moves: MoveResult[] = [];
    const movesOnce = 'KN'.includes(PIECE_TO_TYPE[piece]); // king and knight can only move once
    for (const dir of dirs) {
      // try move in a ray
      let to = from + dir;
      while (!(to & 0x88 || this.board[to])) {
        moves.push(getMoveResult({ board: this.board, from, to, piece, color: this.activeColor, type: MoveType.STANDARD_MOVE }));
        if (movesOnce) break;
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

  getPawnCapturesFrom(from: number): MoveResult[] {
    const piece = this.board[from];
    if (piece != PAWNS[this.activeColor]) return [];
    const capturable = PIECE_MOVE_PATTERNS[piece].slice(2).map(dir => from + dir);
    const captures = capturable.filter(to => {
      const found = this.board[to];
      return found && PIECE_TO_COLOR[found] == ENEMY_COLOR[this.activeColor];
    }).map(to => getMoveResult({ board: this.board, from, to, piece, color: this.activeColor, type: MoveType.CAPTURE }));
    if (!this.enPassantSquare || !capturable.includes(this.enPassantSquare)) return captures;
    const enPassant = getMoveResult({ board: this.board, from, to: this.enPassantSquare, piece, color: this.activeColor, type: MoveType.EN_PASSANT });
    return [...captures, enPassant];
  }

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

  getCastlesFrom(type: CastleType, from: number): MoveResult[] {
    const { kingMove, between, rookMove } = CASTLE_MOVES[this.activeColor][type];
    if (!this.hasCastlingRights[this.activeColor][type] || from != kingMove.from) return [];
    const king = this.board[kingMove.from];
    if (king != KINGS[this.activeColor] || this.board[rookMove.from] != ROOKS[this.activeColor]) return [];
    if (isCheck(this.board, this.activeColor) || between.some(square => this.board[square] || isAttacked(this.board, square, this.activeColor))) return [];
    return [getMoveResult({ board: this.board, from, to: kingMove.to, piece: king, color: this.activeColor, type })];
  }
}

function getMoveResult({ board, from, to, color, piece, type, flags, enPassantSquare }: InternalMove): MoveResult {
  const result = structuredClone(board);
  let captures: number[] = [];
  let explode = false;
  flags ??= {};
  switch (type) {
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
    case MoveType.STANDARD_MOVE:
      movePiece(result, { from, to });
      flags[Flag.PAWN_MOVE] = PIECE_TO_TYPE[piece] == PieceType.PAWN;
      flags[Flag.PROMOTION] = canPromotePawnAt(result, to);
      flags[Flag.DISABLE_BLACK_KINGSIDE_CASTLING] = piece == 'k' || (piece == 'r' && from == CASTLE_MOVES[Color.BLACK][MoveType.KINGSIDE_CASTLE].rookMove.from);
      flags[Flag.DISABLE_BLACK_QUEENSIDE_CASTLING] = piece == 'k' || (piece == 'r' && from == CASTLE_MOVES[Color.BLACK][MoveType.QUEENSIDE_CASTLE].rookMove.from);
      flags[Flag.DISABLE_WHITE_KINGSIDE_CASTLING] = piece == 'K' || (piece == 'R' && from == CASTLE_MOVES[Color.WHITE][MoveType.KINGSIDE_CASTLE].rookMove.from);
      flags[Flag.DISABLE_WHITE_QUEENSIDE_CASTLING] = piece == 'K' || (piece == 'R' && from == CASTLE_MOVES[Color.WHITE][MoveType.QUEENSIDE_CASTLE].rookMove.from);
      return { from, to, color, piece, type, flags, enPassantSquare, result };
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
  return { from, to, color, piece, type: type, flags, enPassantSquare, result, captures, explode };
}
