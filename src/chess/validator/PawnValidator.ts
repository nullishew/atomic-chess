import { PiecesEnum } from "../../enums";
import { equals } from "../AtomicChess";
import { ChessPosition } from "../ChessPosition";
import { AtomicChessValidator } from "./AtomicChessValidator";
import { ChessPieceValidator } from "./ChessPieceValidator";

export class PawnValidator extends ChessPieceValidator {
  constructor(validator: AtomicChessValidator, color: ChessColor) {
    const moveDir = [-1, 1][color];
    const moveDirs: Pos[] = [
      [moveDir, 0]
    ];
    const captureDirs: Pos[] = [
      [moveDir, -1],
      [moveDir, 1],
    ];
    super(validator, PiecesEnum.PAWN, color, moveDirs, captureDirs, 1);
  }

  get startingRank() { return [6, 1][this.color] }

  get moveDir(): number { return this.moveDirs[0][0] }

  possibleDoubleMovesFrom(from: Pos): Pos[] {
    const { position } = this.validator.data;
    const [r, c] = from;
    const to: Pos = [r + 2 * this.moveDir, c];
    return this.possibleStandardMovesFrom(from).length && r == this.startingRank && position.emptyAt(to) ? [to] : [];
  }

  possibleEnPassantFrom(from: Pos): Pos[] {
    const [r, c] = from;
    return this.captureDirs.map(([dr, dc]) => [r + dr, c + dc] as Pos)
      .filter(to => this.validator.data.enPassants.some(p => equals(to, p)));
  }

  validDoubleMovesFrom(from: Pos): Pos[] {
    const { position } = this.validator.data;
    return this.possibleDoubleMovesFrom(from).filter(to => {
      const newPosition = new ChessPosition(position.state);
      newPosition.move(from, to);
      return !this.validator.isAtomicCheck(this.color, newPosition);
    });
  }

  validEnPassantsFrom(from: Pos): Pos[] {
    const { position } = this.validator.data;
    return this.possibleEnPassantFrom(from).filter(to => {
      const newPosition = new ChessPosition(position.state);
      newPosition.enPassant(from, to);
      return newPosition.indexOfKing(this.color) && !this.validator.isAtomicCheck(this.color, newPosition);
    });
  }

  override validMovesFrom(from: Pos): Pos[] {
    return [
      ...this.validCapturesFrom(from),
      ...this.validDoubleMovesFrom(from),
      ...this.validEnPassantsFrom(from),
      ...this.validStandardMovesFrom(from),
    ];
  }

}