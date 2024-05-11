import { Square, FEN, Move, MoveType, GameOverType, Color, getEnemyColor, PromotablePiece, SQUARE_TO_INDEX, gridIndexToSquare, PIECE_TO_COLOR, CastleType } from "./atomicChess";
import { isCheckMate, isStaleMate, getValidStandardCapturesFrom, getValidDoubleMovesFrom, getValidEnPassantsFrom, getValidStandardMovesFrom, getValidCastlesFrom } from "./validator";
import { findKing, AtomicChessResponse, capture, standardMove, enPassant, moveDouble, castle } from "./chessboard";
import { Game as GameScene } from "../scenes/Game";

export class AtomicChessLogic {
  data: FEN;
  game: GameScene;

  constructor(data: FEN, game: GameScene) {
    this.data = data;
    this.game = game;
  }

  tryMove(move: Move): AtomicChessResponse | null {
    const { data } = this;
    const { board, activeColor } = data;
    const {from, to} = move;
    if (getValidDoubleMovesFrom(data, from).includes(to)) return this.update(moveDouble(board, move));
    if (getValidEnPassantsFrom(data, from).includes(to)) return this.update(enPassant(board, move));
    if (getValidCastlesFrom(data, CastleType.KINGSIDE, from).includes(to)) return this.update(castle(board, activeColor, CastleType.KINGSIDE));
    if (getValidCastlesFrom(data, CastleType.QUEENSIDE, from).includes(to)) return this.update(castle(board, activeColor, CastleType.QUEENSIDE));
    if (getValidStandardCapturesFrom(data, from).includes(to)) return this.update(capture(board, move));
    if (getValidStandardMovesFrom(data, from).includes(to)) return this.update(standardMove(this.data.board, move));
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

  isWin(activeColor: Color) {
    const inactiveColor = getEnemyColor(activeColor);
    return isCheckMate(this.data, inactiveColor) || !findKing(this.data.board, inactiveColor);
  }

  isFiftyMoveDraw() {
    return this.data.halfMoves >= 50;
  }

  isStalemate() {
    return isStaleMate(this.data, this.data.activeColor);
  }

  switchTurn() {
    this.data.halfMoves++;
    if (this.data.activeColor == Color.BLACK) {
      this.data.fullMoves++;
    }
    this.data.activeColor = getEnemyColor(this.data.activeColor);
    this.data.enPassantTargets = [];
  }

  update(response: AtomicChessResponse): AtomicChessResponse {
    const { actions, result, moveType } = response;
    const moves = actions.flatMap(({move}) => move.from != move.to ? move : []);
    const explosions = actions.flatMap(({move, explode}) => explode ? move.to : []);

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
