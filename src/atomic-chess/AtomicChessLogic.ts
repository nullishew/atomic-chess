import { Square, FEN, Move, MoveType, GameOverType, Color, getEnemyColor, PromotablePiece, SQUARE_TO_INDEX, gridIndexToSquare, PIECE_TO_COLOR, CastleType, Piece, PIECE_TO_TYPE, PieceType } from "./atomicChess";
import { isCheckmate, isStalemate, getValidStandardCapturesFrom, getValidDoubleMovesFrom, getValidEnPassantsFrom, getValidStandardMovesFrom, getValidCastlesFrom } from "./validator";
import { findKing, MoveData, capture, standardMove, enPassant, moveDouble, castle } from "./chessboard";

// Class that handles the game logic for Atomic Chess
export class AtomicChessLogic {
  data: FEN; // Stores the state of the game in FEN (Forsyth-Edwards Notation)

  constructor(data: FEN) {
    this.data = data;
  }

  // Attempts to make a move on the board, updates the game state accordingly, and returns information about successful moves or null if it is not a valid move
  tryMove(move: Move): MoveData | null {
    const { data } = this;
    const { board, activeColor } = data;
    const { from, to } = move;
    if (getValidDoubleMovesFrom(data, from).includes(to)) return this.update(moveDouble(board, move));
    if (getValidEnPassantsFrom(data, from).includes(to)) return this.update(enPassant(board, move));
    if (getValidCastlesFrom(data, CastleType.KINGSIDE, from).includes(to)) return this.update(castle(board, activeColor, CastleType.KINGSIDE));
    if (getValidCastlesFrom(data, CastleType.QUEENSIDE, from).includes(to)) return this.update(castle(board, activeColor, CastleType.QUEENSIDE));
    if (getValidStandardCapturesFrom(data, from).includes(to)) return this.update(capture(board, move));
    if (getValidStandardMovesFrom(data, from).includes(to)) return this.update(standardMove(this.data.board, move));
    return null;
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
    return isCheckmate(this.data, inactiveColor) || !findKing(this.data.board, inactiveColor);
  }

  // Check for draw by failure to progress the game by either advancing pawns or failure to capture. Usually occurs in endgames that result in king shuffles and bishop shuffles
  isFiftyMoveDraw() {
    return this.data.halfMoves >= 50;
  }

  // Checks for stalemate
  isStalemate() {
    return isStalemate(this.data, this.data.activeColor);
  }

  // Switches turn after a move and updates game state accordingly
  switchTurn() {
    this.data.halfMoves++;
    if (this.data.activeColor == Color.BLACK) {
      this.data.fullMoves++;
    }
    this.data.activeColor = getEnemyColor(this.data.activeColor);
    this.data.enPassantTargets = [];
  }

  // Removes corresponding castling rights when rooks or kings move from their starting position or a rook is captured on its starting position
  updateCastlingRights(piece: Piece | null, square: Square) {
    if (!piece) return;
    const { hasCastlingRights } = this.data;
    const type = PIECE_TO_TYPE[piece];
    if (type == PieceType.KING) {
      hasCastlingRights[PIECE_TO_COLOR[piece]] = { kingside: false, queenside: false };
      return;
    }
    if (type == PieceType.ROOK) {
      const color = PIECE_TO_COLOR[piece];
      const rookStartSquaresToCastleSide: Record<Color, { [key: string]: CastleType }> = {
        [Color.BLACK]: {
          'a8': CastleType.QUEENSIDE,
          'h8': CastleType.KINGSIDE
        },
        [Color.WHITE]: {
          'a1': CastleType.QUEENSIDE,
          'h1': CastleType.KINGSIDE
        }
      };
      if (square in rookStartSquaresToCastleSide[color]) {
        this.data.hasCastlingRights[color][rookStartSquaresToCastleSide[color][square]] = false;
        console.log('shit');
      }
    }
  }

  // Updates game state after a move and returns move data
  update(response: MoveData): MoveData {
    const { actions, result, moveType } = response;
    const moves = actions.flatMap(({ move }) => move.from != move.to ? move : []);
    console.log(moveType);
    this.switchTurn();
    if (moveType == MoveType.DOUBLE) {
      const { from, to } = moves[0];
      const [r1, c] = SQUARE_TO_INDEX[from];
      const r2 = SQUARE_TO_INDEX[to][0];
      this.data.enPassantTargets.push(gridIndexToSquare([(r1 + r2) / 2, c]) as Square);
    }
    const { board } = this.data;
    for (const { from } of moves) {
      const piece = board[from];
      if (!piece) continue;
      this.updateCastlingRights(piece, from);
      // Reset half clock when pawns advance
      if (PIECE_TO_TYPE[piece] == PieceType.PAWN) {
        this.data.halfMoves = 0;
      }
    }

    const explosions = actions.flatMap(({ move, explode }) => explode ? move.to : []);
    if (explosions.length) {
      this.data.halfMoves = 0;
      explosions.forEach(square => this.updateCastlingRights(board[square], square));
    }

    // Update game board and return response
    this.data.board = result;
    return response;
  }

  // Handles pawn promotion
  promote(square: Square, piece: PromotablePiece) {
    console.log(`pawn promotion at ${square} to ${piece}`);
    this.data.board[square] = piece;
  }

}
