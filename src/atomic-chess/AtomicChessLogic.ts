import { Square, FEN, Move, GameOverType, Color, PromotablePiece, CastleSide, ENEMY_COLOR } from "./atomicChess";
import { MoveResult, Flag, isCheckmate, isStalemate, getLegalMovesFrom } from "./atomicChess";
import { findKing } from "./atomicChess";

// Class that handles the game logic for Atomic Chess
export class AtomicChessLogic {
  gameState: FEN; // Stores the state of the game in FEN (Forsyth-Edwards Notation)

  constructor(data: FEN) {
    this.gameState = data;
  }

  // Attempts to make a move on the board, updates the game state accordingly, and returns information about successful moves or null if it is not a valid move
  tryMove({ from, to }: Move): MoveResult | null {
    const legalMove = getLegalMovesFrom(this.gameState, from).find(move => move.to == to);
    if (!legalMove) return null;
    this.switchTurn();
    this.updateFlags(legalMove);
    this.gameState.board = legalMove.result;
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

  // Check for draw
  isDraw() {
    return this.isFiftyMoveDraw();
  }

  // Check if the specified player has won
  isWin(activeColor: Color) {
    const enemyColor = ENEMY_COLOR[activeColor];
    return isCheckmate(this.gameState, enemyColor) || !findKing(this.gameState.board, enemyColor);
  }

  // Check for draw by failure to progress the game by either advancing pawns or failure to capture. Usually occurs in endgames that result in king shuffles and bishop shuffles
  isFiftyMoveDraw() {
    return this.gameState.halfMoves >= 50;
  }

  // Checks for stalemate
  isStalemate() {
    return isStalemate(this.gameState, this.gameState.activeColor);
  }

  // Switches turn after a move and updates game state accordingly
  switchTurn() {
    this.gameState.halfMoves++;
    if (this.gameState.activeColor == Color.BLACK) {
      this.gameState.fullMoves++;
    }
    this.gameState.activeColor = ENEMY_COLOR[this.gameState.activeColor];
    this.gameState.enPassantTargets = [];
  }

  updateFlags(response: MoveResult) {
    const { enPassantTarget, flags } = response;
    if (flags[Flag.PAWN_MOVE] || flags[Flag.CAPTURE]) {
      this.gameState.halfMoves = 0;
    }
    if (flags[Flag.DOUBLE] && enPassantTarget) {
      this.gameState.enPassantTargets.push(enPassantTarget);
    }

    const { hasCastlingRights } = this.gameState;
    hasCastlingRights[Color.BLACK][CastleSide.KINGSIDE] &&= !flags[Flag.DISABLE_BLACK_KINGSIDE_CASTLING];
    hasCastlingRights[Color.BLACK][CastleSide.QUEENSIDE] &&= !flags[Flag.DISABLE_BLACK_QUEENSIDE_CASTLING];
    hasCastlingRights[Color.WHITE][CastleSide.KINGSIDE] &&= !flags[Flag.DISABLE_WHITE_KINGSIDE_CASTLING];
    hasCastlingRights[Color.WHITE][CastleSide.QUEENSIDE] &&= !flags[Flag.DISABLE_WHITE_QUEENSIDE_CASTLING];

  }

  // Handles pawn promotion
  promote(square: Square, piece: PromotablePiece) {
    this.gameState.board[square] = piece;
  }

}