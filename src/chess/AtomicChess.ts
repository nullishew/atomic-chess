import { AtomicChessValidator } from "./validator/AtomicChessValidator";
import { PiecesEnum } from "../enums";
import { ChessSpritePosition } from "./ChessSpritePosition";
import { ChessPosition } from "./ChessPosition";

export type CastlingData = Tuple2<{ kingside: boolean, queenside: boolean }>;
export type FENData = { position: ChessPosition, activeColor: ChessColor, canCastle: CastlingData, enPassants: Pos[], halfMoves: number, fullMoves: number };

export function equals(p1: Pos, p2: Pos) {
  const [r1, c1] = p1;
  const [r2, c2] = p2;
  return r1 == r2 && c1 == c2;
}

export function enemyColor(color: ChessColor): ChessColor {
  return color == 0 ? 1 : 0;
}

export class AtomicChess {
  validator: AtomicChessValidator;
  spritePosition: ChessSpritePosition;
  #data: FENData;

  constructor(data: FENData, spritePosition: ChessSpritePosition) {
    this.#data = data;
    this.validator = new AtomicChessValidator(this.data);
    this.spritePosition = spritePosition;
  }

  get data() { return this.#data }


  isDraw() {
    // does not account for other methods of drawing
    return this.isThreeFoldRepetition() || this.isFiftyMoveDraw();
  }

  // Checks if the given player has won by checkmating or exploding the enemy king
  isWin(color: ChessColor) {
    const inactiveColor = enemyColor(color);
    return this.validator.isCheckMate(inactiveColor) || !this.#data.position.indexOfKing(inactiveColor);
  }

  // Currently not implemented
  isThreeFoldRepetition() {
    return false;
  }

  isFiftyMoveDraw() {
    return this.#data.halfMoves >= 50;
  }

  isStalemate() {
    return this.validator.isStaleMate(this.#data.activeColor);
  }

  // Switches the turn by incrementing the half clock, incrementing full moves every two turns, setting the current color to the opposite color, and resetting the possible en passants
  switchTurn() {
    this.#data.halfMoves++;
    this.#data.fullMoves += this.#data.activeColor % 2;
    this.#data.activeColor = enemyColor(this.#data.activeColor);
    this.#data.enPassants = [];
  }

  // code to promote pawn
  promote(pos: Pos, piece: PromotablePieceNotation) {
    this.#data.position.setAt(pos, piece);
    this.spritePosition.promote(pos, piece);
  }

  // capture a piece and reset the half clock
  capture(from: Pos, to: Pos) {
    console.log('standard capture');
    this.switchTurn();
    this.#data.halfMoves = 0;

    // update chess position and ui
    this.#data.position.capture(from, to);
    this.spritePosition.capture(from, to);
  }

  // ordinary, non special, non capture moves
  moveStandard(from: Pos, to: Pos) {
    console.log('standard move');
    this.switchTurn();
    this.movePiece(from, to);
  }

  // move a pawn two spaces
  moveDouble(from: Pos, to: Pos) {
    console.log('pawn double move');
    this.switchTurn();

    // move the pawn
    this.movePiece(from, to);

    // add the pawn that moved as a potential en passant target
    const [r1, c] = from;
    const r2 = to[0];
    this.#data.enPassants.push([(r1 + r2) / 2, c]);
    console.table(this.#data.enPassants);
  }

  castleKingside(color: ChessColor) {
    console.log('castle kingside');
    this.switchTurn();

    // prevent castling again
    this.#data.canCastle[color] = { kingside: false, queenside: false };

    // update chess position and ui
    this.#data.position.castleKingside(color);
    this.spritePosition.castleKingside(color);
  }

  castleQueenside(color: ChessColor) {
    console.log('castle queenside');
    this.switchTurn();

    // prevent castling again
    this.#data.canCastle[color] = { kingside: false, queenside: false };

    // update chess position and ui
    this.#data.position.castleQueenside(color);
    this.spritePosition.castleQueenside(color);
  }

  enPassant(from: Pos, to: Pos) {
    console.log('en passant!!!!');
    this.switchTurn();

    // update chess position and ui
    this.#data.position.enPassant(from, to);
    this.spritePosition.enPassant(from, to);
  }

  movePiece(from: Pos, to: Pos) {
    const { position } = this.#data;
    const piece = position.at(from);
    if (!piece || !position.emptyAt(to)) return;
    let light, dark;
    switch (position.typeAt(from)) {
      case PiecesEnum.PAWN: // reset half clock when a pawn moves
        this.#data.halfMoves = 0;
        break;
      case PiecesEnum.KING: // prevent castling with a king that has moved
        this.#data.canCastle[position.colorAt(from) as ChessColor] = { kingside: false, queenside: false };
        break;
      case PiecesEnum.ROOK: // prevent castling with rooks that have moved
        ([light, dark] = this.#data.canCastle);
        if (equals(from, [0, 0]) && dark.queenside) {
          dark.queenside = false;
        } else if (equals(from, [0, 7]) && dark.kingside) {
          dark.kingside = false;
        } else if (equals(from, [7, 0]) && light.queenside) {
          light.queenside = false;
        } else if (equals(from, [7, 7]) && light.kingside) {
          light.kingside = false;
        }
        break;
      default:
    }

    // update chess position and ui
    position.move(from, to);
    this.spritePosition.move(from, to);
  }

}