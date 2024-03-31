import { GameObjects, Textures, Tilemaps, Math, Scene } from "phaser";
import { Game } from "../../scenes/Game";
import { ASSETS } from "../../assets";

export abstract class ChessPieceSprite extends GameObjects.Sprite {
  pos: Pos;
  tilemap: Tilemaps.Tilemap;
  particleEmitter: GameObjects.Particles.ParticleEmitter;

  constructor(game: Game, frame: [number, number], color: ChessColor, pos: Pos) {
    const [r, c] = pos;
    const { x, y } = game.chessboardMap.tileToWorldXY(c, r) as Math.Vector2;
    super(game, x, y, ASSETS.CHESS_PIECES.key, frame[color]);
    this.pos = pos;
    this.setOrigin(0);
    // this.setInteractive({ draggable: true });
    // this.on('dragstart', () => {
    //   console.log('started dragging');
    // });
    // this.on('drag', (_: any, mX: number, mY: number) => this.setPosition(mX, mY));
    // this.on('dragend', () => {
    //   console.log('ended dragging');
    //   const { x, y } = game.chessboardMap.worldToTileXY(this.x, this.y) as Math.Vector2;
    //   this.move([y, x]);
    // });
  }

  get game() { return this.scene as Game }

  move(pos: Pos) {
    this.pos = pos;
    const [r, c] = pos;
    const { x, y } = this.game.chessboardMap.tileToWorldXY(c, r) as Math.Vector2;
    const tween = this.game.tweens.add({
      targets: this,
      x: x,
      y: y,
      ease: 'quad.in',
      duration: 100,
    });
    tween.on('complete', () => {
      this.setPosition(x, y);
    });
  }

  explode() {
    const [r, c] = this.pos;
    const { x, y } = this.game.chessboardMap.tileToWorldXY(c, r) as Math.Vector2;
    const tween = this.game.tweens.add({
      targets: this,
      x: x,
      y: y,
      ease: 'quad.in',
      duration: 100,
    });
    tween.on('complete', () => {
      const { explosionParticles, cameras, explosionSound } = this.game;
      explosionParticles.explode(50, this.x, this.y);
      cameras.main.shake(500, .005);
      explosionSound.play();
      this.setPosition(x, y);
      this.destroy();
    });
  }

}