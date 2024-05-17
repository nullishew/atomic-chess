import { Square, FEN, Move, GameOverType, Color, getEnemyColor, PromotablePiece, SQUARE_TO_GRID_INDEX, gridIndexToSquare, CastleSide } from "./atomicChess";
import { ExternalMove, Flag, isCheckmate, isStalemate, legalMovesFrom } from "./atomicChess";
import { findKing } from "./atomicChess";

// Class that handles the game logic for Atomic Chess
export class AtomicChessLogic {
  gameState: FEN; // Stores the state of the game in FEN (Forsyth-Edwards Notation)

  constructor(data: FEN) {
    this.gameState = data;
  }

  // Attempts to make a move on the board, updates the game state accordingly, and returns information about successful moves or null if it is not a valid move
  tryMove({ from, to }: Move): ExternalMove | null {
    const legalMove = legalMovesFrom(this.gameState, from).find(move => move.to == to);
    if (!legalMove) return null;
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
    const inactiveColor = getEnemyColor(activeColor);
    return isCheckmate(this.gameState, inactiveColor) || !findKing(this.gameState.board, inactiveColor);
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
    this.gameState.activeColor = getEnemyColor(this.gameState.activeColor);
    this.gameState.enPassantTargets = [];
  }

  updateFlags(response: ExternalMove) {
    const { actions, moveType, flags, color } = response;
    const moves = actions.flatMap(({ move }) => move.from != move.to ? move : []);
    this.switchTurn();
    if (flags.includes(Flag.DOUBLE)) {
      const { from, to } = moves[0];
      const [r1, c] = SQUARE_TO_GRID_INDEX[from];
      const r2 = SQUARE_TO_GRID_INDEX[to][0];
      this.gameState.enPassantTargets.push(gridIndexToSquare([(r1 + r2) / 2, c]) as Square);
    }
    if (flags.includes(Flag.KING_MOVE)) {
      this.gameState.hasCastlingRights[color] = { kingside: false, queenside: false };
    }
    const enemyColor = getEnemyColor(color);
    if (flags.includes(Flag.KINGSIDE_ROOK_MOVE)) {
      this.gameState.hasCastlingRights[color][CastleSide.KINGSIDE] = false;
    } else if (flags.includes(Flag.QUEENSIDE_ROOK_MOVE)) {
      this.gameState.hasCastlingRights[color][CastleSide.QUEENSIDE] = false;
    }
    if (flags.includes(Flag.KINGSIDE_ROOK_CAPTURED)) {
      this.gameState.hasCastlingRights[enemyColor][CastleSide.KINGSIDE] = false;
    }
    if (flags.includes(Flag.QUEENSIDE_ROOK_CAPTURED)) {
      this.gameState.hasCastlingRights[enemyColor][CastleSide.QUEENSIDE] = false;
    }
    if (flags.includes(Flag.PAWN_MOVE) || flags.includes(Flag.CAPTURE)) {
      this.gameState.halfMoves = 0;
    }
  }

  // Handles pawn promotion
  promote(square: Square, piece: PromotablePiece) {
    this.gameState.board[square] = piece;
  }

}