import { GameObjects } from "phaser";
import { BishopSprite } from "./sprites/BishopSprite";
import { ChessPieceSprite } from "./sprites/ChessPieceSprite";
import { KingSprite } from "./sprites/KingSprite";
import { KnightSprite } from "./sprites/KnightSprite";
import { PawnSprite } from "./sprites/PawnSprite";
import { QueenSprite } from "./sprites/QueenSprite";
import { RookSprite } from "./sprites/RookSprite";
import { Game } from "../scenes/Game";
import { ChessPositionArrayNotation, Pos, PieceNotation, ChessColor } from "./AtomicChess";

// Class to represent the GUI for Chess
export class ChessSpritePosition {
  #state: (ChessPieceSprite | null)[][]; // 2D array to store chess piece sprites
  scene: Game; // Reference to the game scene
  container: GameObjects.Container; // Container to hold chess piece sprites

  constructor(game: Game, state: ChessPositionArrayNotation) {
    // Initialize properties
    this.container = game.add.container(0, 0);
    this.#state = state.map((row, r) => row.map(
      (type, c) => {
        const sprite = createChessPieceSprite(game, type, [r, c]); // Create chess piece sprite
        if (sprite) {
          this.container.add(sprite); // Add sprite to container
        }
        return sprite; // Return sprite
      }
    ));
    this.scene = game; // Assign game scene reference
  }

  // Getter for retrieving the state of the chess sprites
  get state() { return this.#state.map(row => row.slice()) }

  // Method to get the chess piece sprite at a given position
  at([r, c]: Pos): ChessPieceSprite | null {
    return this.#state?.[r]?.[c];
  }

  // Method to set a chess piece sprite at a given position
  setAt([r, c]: Pos, piece: ChessPieceSprite | null) {
    this.#state[r][c] = piece;
  }

  // Method to promote a pawn to another piece
  promote(pos: Pos, piece: PieceNotation) {
    this.at(pos)?.destroy(); // Destroy existing pawn sprite
    const sprite = createChessPieceSprite(this.scene, piece, pos) as ChessPieceSprite; // Create new sprite for promoted piece
    this.container.add(sprite); // Add sprite to container
    this.setAt(pos, sprite); // Set sprite at position
  }

  // Method to capture a piece
  capture(from: Pos, to: Pos) {
    this.explode(to); // Explode the captured piece
    this.at(from)?.move(to); // Move capturing piece to new position
    this.explode(from); // Explode the capturing piece
    this.explodeArea(to); // Explode surrounding pieces affected by capture
  }

  // Method to perform kingside castling
  castleKingside(color: ChessColor) {
    const r = [7, 0][color];
    this.move([r, 4], [r, 6]); // Move king
    this.move([r, 7], [r, 5]); // Move rook
  }

  // Method to perform queenside castling
  castleQueenside(color: ChessColor) {
    const r = [7, 0][color];
    this.move([r, 4], [r, 2]); // Move king
    this.move([r, 0], [r, 3]); // Move rook
  }

  // Method to perform en passant capture
  enPassant(from: Pos, to: Pos) {
    const r1 = from[0];
    const c2 = to[1];
    this.explode([r1, c2]);
    this.explode(from);
    this.explodeArea(to);
  }

  // Method to move a piece
  move(from: Pos, to: Pos) {
    const piece = this.at(from); // Get piece at source position
    piece?.move(to); // Move the piece
    this.setAt(to, piece); // Set piece at new position
    this.setAt(from, null); // Remove piece from old position
  }

  // Method to explode a piece
  explode(pos: Pos) {
    this.at(pos)?.explode(); // Explode the piece
    this.setAt(pos, null); // Remove piece from position
  }

  // Method to explode surrounding pieces affected by capture
  explodeArea([r, c]: Pos) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const pos: Pos = [r + dr, c + dc];
        if (!this.at(pos) || this.at(pos) instanceof PawnSprite) continue;
        this.explode(pos); // Explode surrounding piece
      }
    }
  }
}

// Factory method to create a chess piece sprite
function createChessPieceSprite(scene: Game, type: PieceNotation | null, pos: Pos) {
  if (!type) return null;
  // Map piece notations to corresponding sprite constructors
  const constructors: Record<PieceNotation, { new(scene: Game, pos: Pos, color: ChessColor): ChessPieceSprite }> = {
    'K': KingSprite,
    'Q': QueenSprite,
    'B': BishopSprite,
    'N': KnightSprite,
    'R': RookSprite,
    'P': PawnSprite,
    'k': KingSprite,
    'q': QueenSprite,
    'b': BishopSprite,
    'n': KnightSprite,
    'r': RookSprite,
    'p': PawnSprite,
  };
  const color = type.toUpperCase() == type ? 0 : 1; // Determine piece color
  return scene.add.existing(new constructors[type](scene, pos, color)); // Create and return sprite
}
