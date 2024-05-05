import { GameObjects } from "phaser";
import { Game as GameScene, getTileIndexAtSquareIndex, PIECE_TO_TEXTURE_FRAME } from "../scenes/Game";
import { ChessPieceSprite } from "../sprites/ChessPieceSprite";
import { MoveType, isValidCapture, isValidDoubleMove, isValidEnPassant, isValidKingsideCastle, isValidQueensideCastle, isValidStandardMove, Color, getEnemyColor, isCheckMate, isStaleMate, PIECE_TO_TYPE, PieceType, PIECE_TO_COLOR, Piece, Pos, canPromotePawn } from "./validator/atomicChessValidator";
import { Square, FEN, Move, findKing, ChessActionLog, SQUARE_TO_INDEX, capture, getSquareAtPos, castleKingside, castleQueenside, enPassant, standardMove, Chessboard } from "./validator/atomicChessboard";

export type PromotablePieceNotation = 'Q' | 'q' | 'B' | 'b' | 'N' | 'n' | 'R' | 'r';
export enum GameOverType {
  WHITE_WIN = 'w',
  BLACK_WIN = 'b',
  DRAW = 'd',
  STALEMATE = 's',
}

// Class representing a game of Atomic Chess
export class AtomicChess {
  sprites: Record<Square, ChessPieceSprite | null>; // Store the GUI
  data: FEN;
  game: GameScene;
  spriteContainer: GameObjects.Container

  constructor(data: FEN, game: GameScene, spriteContainer: GameObjects.Container) {
    this.data = data;
    this.game = game;
    this.spriteContainer = spriteContainer;
    this.sprites = createChessPieceSprites(game, spriteContainer, data.board);
  }

  tryMove(move: Move): MoveType | null {
    if (isValidCapture(this.data, move)) {
      this.capture(move);
      return MoveType.CAPTURE;
    }
    if (isValidDoubleMove(this.data, move)) {
      this.moveDouble(move);
      return MoveType.DOUBLE;
    }
    if (isValidEnPassant(this.data, move)) {
      this.enPassant(move);
      return MoveType.EN_PASSANT;
    }
    if (isValidKingsideCastle(this.data, move)) {
      this.castleKingside(this.data.activeColor);
      return MoveType.KINGSIDE_CASTLE;
    }
    if (isValidQueensideCastle(this.data, move)) {
      this.castleQueenside(this.data.activeColor);
      return MoveType.QUEENSIDE_CASTLE;
    }
    if (isValidStandardMove(this.data, move)) {
      this.moveStandard(move);
      return canPromotePawn(this.data.board, move.to) ? MoveType.PROMOTION : MoveType.STANDARD_MOVE;
    }
    return null;
  }

  tryGameOver(): GameOverType | null {
    if (this.isDraw()) return GameOverType.DRAW;
    if (this.isStalemate()) return GameOverType.STALEMATE;
    if (this.isWin(Color.WHITE)) return GameOverType.WHITE_WIN;
    if (this.isWin(Color.BLACK)) return GameOverType.BLACK_WIN;
    return null;
  }

  // does not account for threefold repetition
  isDraw() {
    return this.isFiftyMoveDraw();
  }

  // Checks if the given player has won by checkmating or exploding the enemy king
  isWin(color: Color) {
    const inactiveColor = getEnemyColor(color);
    const { board } = this.data;
    return isCheckMate(this.data) || !findKing(board, inactiveColor);
  }

  isFiftyMoveDraw() {
    return this.data.halfMoves >= 50;
  }

  isStalemate() {
    return isStaleMate(this.data, this.data.activeColor);
  }

  // Switches the turn by incrementing the half clock, incrementing full moves every two turns, setting the current color to the opposite color, and resetting the possible en passants
  switchTurn() {
    this.data.halfMoves++;
    this.data.fullMoves += +(this.data.activeColor == Color.BLACK);
    this.data.activeColor = getEnemyColor(this.data.activeColor);
    this.data.enPassantTargets = [];
  }

  // perhaps add parameters like pawn moved, rook moved, king moved, and captured to make things easier
  update({ moves, explosions, result }: ChessActionLog) {
    this.data.board = result;
    for (const square of explosions) {
      this.sprites[square]?.explode();
    }
    for (const { from, to } of moves) {
      this.sprites[from]?.move(to);
      this.sprites[to] = this.sprites[from];
      this.sprites[from] = null;
    }
    for (const square of explosions) {
      this.sprites[square]?.explode();
      this.sprites[square] = null;
    }
  }

  // code to promote pawn
  promote(square: Square, piece: PromotablePieceNotation) {
    console.log('promotion');
    this.data.board[square] = piece;
    this.sprites[square]?.destroy();
    const sprite = createChessPieceSprite(this.game, piece, getTileIndexAtSquareIndex(SQUARE_TO_INDEX[square]));
    this.spriteContainer.add(sprite);
    this.sprites[square] = sprite;
  }

  // capture a piece and reset the half clock
  capture(move: Move) {
    console.log('standard capture');
    this.switchTurn();
    this.data.halfMoves = 0;

    // update chess position and ui
    this.update(capture(this.data.board, move));
  }

  // ordinary, non special, non capture moves
  moveStandard(move: Move) {
    console.log('standard move');
    this.switchTurn();
    this.movePiece(move);
  }

  // move a pawn two spaces
  moveDouble(move: Move) {
    console.log('pawn double move');
    this.switchTurn();

    // move the pawn
    this.movePiece(move);

    // add the pawn that moved as a potential en passant target
    const { from, to } = move;
    const [r1, c] = SQUARE_TO_INDEX[from];
    const r2 = SQUARE_TO_INDEX[to][0];
    this.data.enPassantTargets.push(getSquareAtPos([(r1 + r2) / 2, c]) as Square);
  }

  castleKingside(activeColor: Color) {
    console.log('castle kingside');
    this.switchTurn();

    this.data.canCastle[activeColor] = { kingside: false, queenside: false };

    this.update(castleKingside(this.data.board, activeColor));
  }

  castleQueenside(activeColor: Color) {
    console.log('castle queenside');
    this.switchTurn();

    this.data.canCastle[activeColor] = { kingside: false, queenside: false };

    this.update(castleQueenside(this.data.board, activeColor));
  }

  enPassant(move: Move) {
    console.log('en passant!!!!');
    this.switchTurn();

    this.data.halfMoves = 0;

    // update chess position and ui
    this.update(enPassant(this.data.board, move));

  }

  movePiece(move: Move) {
    const { board } = this.data;
    const { from, to } = move;
    const piece = board[from];
    if (!piece || board[to]) return;
    switch (PIECE_TO_TYPE[piece]) {
      case PieceType.PAWN: // reset half clock when a pawn moves
        this.data.halfMoves = 0;
        break;
      case PieceType.KING: // prevent castling with a king that has moved
        this.data.canCastle[PIECE_TO_COLOR[piece]] = { kingside: false, queenside: false };
        break;
      case PieceType.ROOK: // prevent castling with rooks that have moved
        const { black, white } = this.data.canCastle;
        if (PIECE_TO_COLOR[piece] == Color.WHITE) {
          if (from == 'a1') {
            white.queenside = false;
          } else if (from == 'h1') {
            white.kingside = false;
          }
        } else {
          if (from == 'a8') {
            black.queenside = false;
          } else if (from == 'h8') {
            black.kingside = false;
          }
        }
        break;
      default:
    }

    // update chess position and ui
    this.update(standardMove(board, move));
  }

}

// Factory method to create a chess piece sprite
export function createChessPieceSprite(scene: GameScene, piece: Piece, pos: Pos) {
  return scene.add.existing(new ChessPieceSprite(scene, PIECE_TO_TEXTURE_FRAME[piece], pos)); // Create and return sprite
}

function createChessPieceSprites(scene: GameScene, container: GameObjects.Container, board: Chessboard) {
  const chessboardSprites: Record<Square, ChessPieceSprite | null> = {} as Record<Square, ChessPieceSprite | null>;
  for (const [square, piece] of Object.entries(board) as [Square, Piece | null][]) {
    if (!piece) {
      chessboardSprites[square] = null;
      continue;
    }
    const sprite = createChessPieceSprite(scene, piece, getTileIndexAtSquareIndex(SQUARE_TO_INDEX[square]));
    chessboardSprites[square] = sprite;
    container.add(sprite);
  }
  return chessboardSprites;
}