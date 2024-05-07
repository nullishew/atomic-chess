import { GameObjects } from "phaser";
import { PIECE_TO_TEXTURE_FRAME } from "../assets";
import { Square, FEN, Move, MoveType, GameOverType, Color, getEnemyColor, PromotablePiece, PIECE_TO_TYPE, PIECE_TO_COLOR, PieceType, SQUARE_TO_INDEX, gridIndexToSquare, Piece, Chessboard, CHESSBOARD_SQUARES } from "./atomicChessData";
import { isValidStandardCapture, isValidDoubleMove, isValidEnPassant, isValidKingsideCastle, isValidQueensideCastle, isValidStandardMove, canPromotePawnAt, isCheckMate, isStaleMate } from "./validator";
import { findKing, ChessActionLog, capture, standardMove, castleKingside, castleQueenside, enPassant } from "./chessboard";
import { Game as GameScene } from "../scenes/Game";
import { ChessPiece } from "./ChessPieceSprite";

export class AtomicChess {
  sprites: Record<Square, ChessPiece | null>;
  data: FEN;
  game: GameScene;
  spriteContainer: GameObjects.Container

  constructor(data: FEN, game: GameScene, spriteContainer: GameObjects.Container) {
    this.data = structuredClone(data);
    this.game = game;
    this.spriteContainer = spriteContainer;
    this.sprites = createChessPieceSprites(game, spriteContainer, data.board);
  }

  tryMove(move: Move): MoveType | null {
    if (isValidStandardCapture(this.data, move)) {
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
      return canPromotePawnAt(this.data.board, move.to) ? MoveType.PROMOTION : MoveType.STANDARD_MOVE;
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

  isDraw() {
    return this.isFiftyMoveDraw();
  }

  isWin(color: Color) {
    const inactiveColor = getEnemyColor(color);
    const { board } = this.data;
    return isCheckMate(this.data, inactiveColor) || !findKing(board, inactiveColor);
  }

  isFiftyMoveDraw() {
    return this.data.halfMoves >= 50;
  }

  isStalemate() {
    return isStaleMate(this.data, this.data.activeColor);
  }

  switchTurn() {
    this.data.halfMoves++;
    this.data.fullMoves += +(this.data.activeColor == Color.BLACK);
    this.data.activeColor = getEnemyColor(this.data.activeColor);
    this.data.enPassantTargets = [];
  }

  explosionUpdate = (square: Square) => {
    this.sprites[square]?.explode();
    this.sprites[square] = null;
  }

  moveUpdate = ({from, to}: Move) => {
    // console.log('fdfsdfsd');
    this.sprites[from]?.move(to);
    this.sprites[to] = this.sprites[from];
    this.sprites[from] = null;
  }

  update({ moves, explosions, result }: ChessActionLog) {
    this.data.board = result;
    explosions.forEach(this.explosionUpdate);
    moves.forEach(this.moveUpdate);
    explosions.forEach(this.explosionUpdate);
  }

  promote(square: Square, piece: PromotablePiece) {
    console.log(`pawn promotion at ${square} to ${piece}`);
    this.data.board[square] = piece;
    this.sprites[square]?.destroy();
    const sprite = createChessPieceSprite(this.game, piece, square);
    this.spriteContainer.add(sprite);
    this.sprites[square] = sprite;
  }

  capture(move: Move) {
    console.log('standard capture');
    this.switchTurn();
    this.data.halfMoves = 0;
    const { to } = move;
    const capturedPiece = this.data.board[to];
    const { black, white } = this.data.hasCastlingRights;
    switch (capturedPiece) {
      case 'R':
        if (to == 'a1') {
          white.queenside = false;
        } else if (to == 'h1') {
          white.kingside = false;
        }
        break;
      case 'r':
        if (to == 'a8') {
          black.queenside = false;
        } else if (to == 'h8') {
          black.kingside = false;
        }
        break;
    }
    this.update(capture(this.data.board, move));
  }

  moveStandard(move: Move) {
    console.log('standard move');
    this.switchTurn();
    const { from } = move;
    const piece = this.data.board[from];
    if (!piece) return;
    const type = PIECE_TO_TYPE[piece];
    const color = PIECE_TO_COLOR[piece];
    switch (type) {
      case PieceType.PAWN:
        this.data.halfMoves = 0;
        break;
      case PieceType.KING:
        this.data.hasCastlingRights[color] = { kingside: false, queenside: false };
        break;
      case PieceType.ROOK:
        const { black, white } = this.data.hasCastlingRights;
        if (color == Color.WHITE) {
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
    }
    this.update(standardMove(this.data.board, move));
  }

  moveDouble(move: Move) {
    this.moveStandard(move);
    const { from, to } = move;
    const [r1, c] = SQUARE_TO_INDEX[from];
    const r2 = SQUARE_TO_INDEX[to][0];
    this.data.enPassantTargets.push(gridIndexToSquare([(r1 + r2) / 2, c]) as Square);
  }

  castleKingside(activeColor: Color) {
    console.log('kingside castle');
    this.switchTurn();
    this.data.hasCastlingRights[activeColor] = { kingside: false, queenside: false };
    this.update(castleKingside(this.data.board, activeColor));
  }

  castleQueenside(activeColor: Color) {
    console.log('queenside castle');
    this.switchTurn();
    this.data.hasCastlingRights[activeColor] = { kingside: false, queenside: false };
    this.update(castleQueenside(this.data.board, activeColor));
  }

  enPassant(move: Move) {
    console.log('en passant');
    this.switchTurn();
    this.data.halfMoves = 0;
    this.update(enPassant(this.data.board, move));
  }
}

function createChessPieceSprite(scene: GameScene, piece: Piece, square: Square): ChessPiece {
  return scene.add.existing(new ChessPiece(scene, PIECE_TO_TEXTURE_FRAME[piece], square));
}

function createChessPieceSprites(scene: GameScene, container: GameObjects.Container, board: Chessboard): Record<Square, ChessPiece | null> {
  const sprites: Record<Square, ChessPiece | null> = {} as Record<Square, ChessPiece | null>;
  for (const square of CHESSBOARD_SQUARES) {
    const piece = board[square];
    if (!piece) {
      sprites[square] = null;
      continue;
    }
    const sprite = createChessPieceSprite(scene, piece, square);
    sprites[square] = sprite;
    container.add(sprite);
  }
  return sprites;
}