import { GameObjects, Tilemaps } from "phaser";
import { BishopSprite } from "./sprites/BishopSprite";
import { ChessPieceSprite } from "./sprites/ChessPieceSprite";
import { KingSprite } from "./sprites/KingSprite";
import { KnightSprite } from "./sprites/KnightSprite";
import { PawnSprite } from "./sprites/PawnSprite";
import { QueenSprite } from "./sprites/QueenSprite";
import { RookSprite } from "./sprites/RookSprite";
import { Game } from "../scenes/Game";

export class ChessSpritePosition {
  #state: (ChessPieceSprite | null)[][];
  scene: Game;
  tilemap: Tilemaps.Tilemap;
  emitter: GameObjects.Particles.ParticleEmitter;
  container: GameObjects.Container;

  constructor(game: Game, state: ChessPositionArrayNotation) {
    this.container = game.add.container(0, 0);
    this.#state = state.map((row, r) => row.map(
      (type, c) => {
        const sprite = createChessPieceSprite(game, type, [r, c])
        if (sprite) {
          this.container.add(sprite);
        }
        return sprite;
      }
    ));
    this.scene = game;
  }

  get state() { return this.#state.map(row => row.slice()) }

  at([r, c]: Pos): ChessPieceSprite | null {
    return this.#state?.[r]?.[c];
  }

  setAt([r, c]: Pos, piece: ChessPieceSprite | null) {
    this.#state[r][c] = piece;
  }

  promote(pos: Pos, piece: PieceNotation) {
    this.at(pos)?.destroy();
    const sprite = createChessPieceSprite(this.scene, piece, pos) as ChessPieceSprite;
    this.container.add(sprite);
    this.setAt(pos, sprite);
  }

  capture(from: Pos, to: Pos) {
    this.explode(to);
    this.at(from)?.move(to);
    this.explode(from);
    this.explodeArea(to);
  }

  castleKingside(color: ChessColor) {
    const r = [7, 0][color];
    this.move([r, 4], [r, 6]);
    this.move([r, 7], [r, 5]);
  }

  castleQueenside(color: ChessColor) {
    const r = [7, 0][color];
    this.move([r, 4], [r, 2]);
    this.move([r, 0], [r, 3]);
  }

  enPassant(from: Pos, to: Pos) {
    const r1 = from[0];
    const c2 = to[1];
    this.explode([r1, c2]);
    this.explode(from);
    this.explodeArea(to);
  }

  move(from: Pos, to: Pos) {
    const piece = this.at(from);
    piece?.move(to);
    this.setAt(to, piece);
    this.setAt(from, null);
  }

  explode(pos: Pos) {
    this.at(pos)?.explode();
    this.setAt(pos, null);
  }

  explodeArea([r, c]: Pos) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const pos: Pos = [r + dr, c + dc];
        if (!this.at(pos) || this.at(pos) instanceof PawnSprite) continue;
        this.explode(pos);
      }
    }
  }

}

function createChessPieceSprite(scene: Game, type: PieceNotation | null, pos: Pos) {
  if (!type) return null;
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
  const color = type.toUpperCase() == type ? 0 : 1;
  return scene.add.existing(new constructors[type](scene, pos, color));
}