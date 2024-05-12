import { Scene, Tilemaps, GameObjects, Sound } from "phaser";
import { Square, CHESSBOARD_SQUARES, Piece, Chessboard, INITIAL_CHESSBOARD_POSITION, PromotablePiece, Move, MoveType } from "./atomicChess";
import { squareToWorldXY } from "../scenes/Game";
import { ASSETS, PIECE_TO_TEXTURE_FRAME } from "../assets";
import { ChessPiece } from "./ChessPieceSprite";
import { MoveData } from "./chessboard";

export class AtomicChessGUI {
  scene: Scene;

  chessboardTilemap: Tilemaps.Tilemap;

  sprites: Record<Square, ChessPiece | null>;

  pointerTileIndicator: GameObjects.Graphics;
  selectedTileIndicator: GameObjects.Graphics;

  moveIndicators: Record<Square, GameObjects.Graphics>;
  captureIndicators: Record<Square, GameObjects.Graphics>;

  explosionSound: Sound.NoAudioSound | Sound.HTML5AudioSound | Sound.WebAudioSound;
  explosionParticles: GameObjects.Particles.ParticleEmitter;

  pieceMoveTime: number;

  constructor(scene: Scene, tileSize: number, pieceMoveTime: number) {
    this.scene = scene;

    this.pieceMoveTime = pieceMoveTime;

    // Center game view
    scene.cameras.main.centerOn(0, 0);

    // Add chessboard
    this.chessboardTilemap = createChessboard(this.scene, tileSize);

    // Add chess pieces
    const chessPieceContainer = this.scene.add.container();
    this.sprites = createChessPieceSprites(scene, this.chessboardTilemap, chessPieceContainer, structuredClone(INITIAL_CHESSBOARD_POSITION));

    // Add tile indicators (mouse hover, selected)
    const tileIndicatorContainer = this.scene.add.container();
    this.pointerTileIndicator = createTileMarker(this.scene, tileSize, tileSize * .1, 0xffffff, 1).setVisible(false);
    this.selectedTileIndicator = createTileMarker(this.scene, tileSize, tileSize * .1, 0xffffff, 1).setVisible(false);
    tileIndicatorContainer.add([this.pointerTileIndicator, this.selectedTileIndicator]);

    // Add action indicators (move, capture)
    const actionIndicatorContainer = this.scene.add.container();
    this.captureIndicators = {} as Record<Square, GameObjects.Graphics>;
    this.moveIndicators = {} as Record<Square, GameObjects.Graphics>;
    for (const square of CHESSBOARD_SQUARES) {
      let { x, y } = squareToWorldXY(square, this.chessboardTilemap);
      x += .5 * tileSize;
      y += .5 * tileSize;
      this.captureIndicators[square] = createCaptureMarker(this.scene, x, y, .125 * tileSize, .4375 * tileSize);
      this.moveIndicators[square] = createMoveMarker(this.scene, x, y, .125 * tileSize);
      actionIndicatorContainer.add([
        this.captureIndicators[square].setVisible(false),
        this.moveIndicators[square].setVisible(false)
      ]);
    }

    // Add explosion particles
    this.explosionParticles = this.scene.add.particles(0, 0, ASSETS.PARTICLE.key, {
      speed: { min: 300, max: 600 },
      scale: { start: .6, end: 0, random: true },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 300, max: 600 },
      emitting: false,
    });

    // Add explosion sound
    this.explosionSound = this.scene.sound.add(ASSETS.EXPLOSION.key);

  }

  explode(x: number, y: number) {
    this.explosionParticles.explode(50, x, y);
    this.scene.cameras.main.shake(500, .01);
    this.explosionSound.play();
  }

  highlightSquare(square: Square | null) {
    if (!square) {
      this.pointerTileIndicator.visible = false;
      return;
    }
    const { x, y } = squareToWorldXY(square, this.chessboardTilemap);
    this.pointerTileIndicator.setPosition(x, y)
      .setVisible(true);
  }

  // Select a square
  selectSquare(square: Square) {
    const { x, y } = squareToWorldXY(square, this.chessboardTilemap);
    this.selectedTileIndicator.setPosition(x, y)
      .setVisible(true);
  }

  // Deselect a square
  deselectSquare() {
    this.selectedTileIndicator.visible = false;
  }

  indicateMovableSquares(squares: Square[]) {
    squares.forEach(square => this.moveIndicators[square].visible = true);
  }

  indicateCapturableSquares(squares: Square[]) {
    squares.forEach(square => this.captureIndicators[square].visible = true);
  }

  // Hide action markers
  hideActionIndicators() {
    for (const square of CHESSBOARD_SQUARES) {
      this.captureIndicators[square].visible = false;
      this.moveIndicators[square].visible = false;
    }
  }

  update({ actions }: MoveData) {
    for (const { move: { from, to }, explode } of actions) {
      const sprite = this.sprites[from];
      if (!sprite) continue;
      const {x, y} = squareToWorldXY(to, this.chessboardTilemap);
      sprite.move(x, y, explode, this.pieceMoveTime);
      if (!explode) continue;
      this.scene.time.addEvent({
        delay: this.pieceMoveTime,
        callback: () => this.explode(x, y),
      });
    }
    for (const { move: { from, to }, explode } of actions) {
      if (to != from) {
        this.sprites[to] = this.sprites[from];
        this.sprites[from] = null;
      }
      if (explode) {
        this.sprites[to] = null;
      }
    }
  }


  promoteSprite(square: Square, piece: PromotablePiece) {
    this.sprites[square]?.promote(piece);
  }
}

// Function to create chessboard tilemap
function createChessboard(scene: Scene, tileSize: number): Tilemaps.Tilemap {
  const data = [
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0]
  ];
  const map = scene.make.tilemap({ data: data, tileWidth: tileSize, tileHeight: tileSize });
  const tileset = map.addTilesetImage(ASSETS.CHESSBOARD_TILES.key) as Tilemaps.Tileset;
  const layer = map.createLayer(0, tileset, 0, 0) as Tilemaps.TilemapLayer;
  const { x, y } = (layer.getBottomRight() as Phaser.Math.Vector2).scale(-.5);
  layer.setPosition(x, y);
  return map;
}

// Function to create a tile marker
function createTileMarker(scene: Scene, tileSize: number, lineWidth: number, color: number, alpha: number): GameObjects.Graphics {
  return scene.add.graphics()
    .lineStyle(lineWidth, color, alpha)
    .strokeRect(0, 0, tileSize, tileSize);
}

// Function to create a move marker
function createMoveMarker(scene: Scene, x: number, y: number, size: number): GameObjects.Graphics {
  return scene.add.graphics()
    .fillStyle(0x000000, .3)
    .fillCircle(x, y, size)
    .setActive(false);
}

// Function to create a capture marker
function createCaptureMarker(scene: Scene, x: number, y: number, lineWidth: number, size: number): GameObjects.Graphics {
  return scene.add.graphics()
    .lineStyle(lineWidth, 0x000000, .3)
    .strokeCircle(x, y, size)
    .setActive(false);
}

function createChessPieceSprite(scene: Scene, piece: Piece, x: number, y: number): ChessPiece {
  return scene.add.existing(new ChessPiece(scene, PIECE_TO_TEXTURE_FRAME[piece], x, y));
}

function createChessPieceSprites(scene: Scene, tilemap: Tilemaps.Tilemap, container: GameObjects.Container, board: Chessboard): Record<Square, ChessPiece | null> {
  const sprites: Record<Square, ChessPiece | null> = {} as Record<Square, ChessPiece | null>;
  for (const square of CHESSBOARD_SQUARES) {
    const piece = board[square];
    if (!piece) {
      sprites[square] = null;
      continue;
    }
    const {x, y} = squareToWorldXY(square, tilemap);
    const sprite = createChessPieceSprite(scene, piece, x, y);
    sprites[square] = sprite;
    container.add(sprite);
  }
  return sprites;
}