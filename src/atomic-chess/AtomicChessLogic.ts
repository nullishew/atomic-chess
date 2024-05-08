import { Square, FEN, Move, MoveType, GameOverType, Color, getEnemyColor, PromotablePiece, SQUARE_TO_INDEX, gridIndexToSquare, PIECE_TO_COLOR } from "./atomicChess";
import { isValidStandardCapture, isValidDoubleMove, isValidEnPassant, isValidKingsideCastle, isValidQueensideCastle, isValidStandardMove, isCheckMate, isStaleMate } from "./validator";
import { findKing, AtomicChessResponse, capture, standardMove, castleKingside, castleQueenside, enPassant, moveDouble } from "./chessboard";
import { Game as GameScene } from "../scenes/Game";

export class AtomicChessLogic {
  data: FEN;
  game: GameScene;

  constructor(data: FEN, game: GameScene) {
    this.data = data;
    this.game = game;
  }

  tryMove(move: Move): AtomicChessResponse | null {
    const {data} = this;
    const {board, activeColor} = data;
    if (isValidStandardCapture(data, move)) return this.update(capture(board, move));
    if (isValidDoubleMove(data, move)) return this.update(moveDouble(board, move));
    if (isValidEnPassant(data, move)) return this.update(enPassant(board, move));
    if (isValidKingsideCastle(data, move)) return this.update(castleKingside(board, activeColor));
    if (isValidQueensideCastle(data, move)) return this.update(castleQueenside(board, activeColor));
    if (isValidStandardMove(data, move)) return this.update(standardMove(this.data.board, move));
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


  update(response: AtomicChessResponse): AtomicChessResponse {
    const { moves, explosions, result, moveType } = response;
    console.log(moveType);
    this.switchTurn();
    if (moveType == MoveType.DOUBLE) {
      const { from, to } = moves[0];
      const [r1, c] = SQUARE_TO_INDEX[from];
      const r2 = SQUARE_TO_INDEX[to][0];
      this.data.enPassantTargets.push(gridIndexToSquare([(r1 + r2) / 2, c]) as Square);
    }
    const { board, hasCastlingRights } = this.data;
    for (const { from } of moves) {
      const piece = board[from];
      switch (piece) {
        case 'P':
        case 'p':
          this.data.halfMoves = 0;
          break;
        case 'k':
        case 'K':
          hasCastlingRights[PIECE_TO_COLOR[piece]] = { kingside: false, queenside: false };
          break;
        case 'r':
          if (from == 'a8') {
            hasCastlingRights.black.queenside = false;
          } else if (from == 'h8') {
            hasCastlingRights.black.kingside = false;
          }
          break;
        case 'R':
          if (from == 'a1') {
            hasCastlingRights.white.queenside = false;
          } else if (from == 'h1') {
            hasCastlingRights.white.kingside = false;
          }
          break;
      }
    }
    if (explosions.length) {
      this.data.halfMoves = 0;
      for (const square of explosions) {
        const piece = board[square];
        switch (piece) {
          case 'r':
            if (square == 'a8') {
              hasCastlingRights.black.queenside = false;
            } else if (square == 'h8') {
              hasCastlingRights.black.kingside = false;
            }
            break;
          case 'R':
            if (square == 'a1') {
              hasCastlingRights.white.queenside = false;
            } else if (square == 'h1') {
              hasCastlingRights.white.kingside = false;
            }
            break;
        }
      }
    }

    this.data.board = result;
    return response;
  }

  promote(square: Square, piece: PromotablePiece) {
    console.log(`pawn promotion at ${square} to ${piece}`);
    this.data.board[square] = piece;
  }

}
