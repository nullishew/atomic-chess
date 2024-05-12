import { Scene, Tilemaps, GameObjects, Sound } from "phaser";
import { Square, CHESSBOARD_SQUARES, Piece, Chessboard, INITIAL_CHESSBOARD_POSITION, PromotablePiece } from "./atomicChess";
import { squareToWorldXY } from "../scenes/Game";
import { ASSETS, PIECE_TO_TEXTURE_FRAME } from "../assets";
import { ChessPiece } from "./ChessPieceSprite";
import { MoveData } from "./chessboard";

// Define a class to manage the graphical user interface of an atomic chess game
export class AtomicChessGUI {
  scene: Scene; // Scene the gui is part of

  // Tilemap to display chessboard and map squares to world positions
  chessboardTilemap: Tilemaps.Tilemap;
  chessboardTilemapLayer: Tilemaps.TilemapLayer;

  sprites: Record<Square, ChessPiece | null>; // Map squares to corresponding chess piece sprites

  // Graphics objects for indicating selected and hovered tiles
  pointerTileIndicator: GameObjects.Graphics;
  selectedTileIndicator: GameObjects.Graphics;

  // Graphics objects for indicate possible moves and captures
  moveIndicators: Record<Square, GameObjects.Graphics>;
  captureIndicators: Record<Square, GameObjects.Graphics>;

  explosionSound: Sound.NoAudioSound | Sound.HTML5AudioSound | Sound.WebAudioSound;
  explosionParticles: GameObjects.Particles.ParticleEmitter;

  pieceMoveTime: number; // Duration of animation for moving and exploding pieces

  constructor(scene: Scene, tileSize: number, pieceMoveTime: number) {
    this.scene = scene;

    this.pieceMoveTime = pieceMoveTime;

    // Center game view
    scene.cameras.main.centerOn(0, 0);

    // Add chessboard
    ({ map: this.chessboardTilemap, layer: this.chessboardTilemapLayer } = createChessboard(this.scene, tileSize));

    // Add chess pieces
    const chessPieceContainer = this.scene.add.container();
    this.sprites = createChessPieceSprites(scene, this.chessboardTilemapLayer, chessPieceContainer, structuredClone(INITIAL_CHESSBOARD_POSITION));

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
      let { x, y } = squareToWorldXY(square, this.chessboardTilemapLayer);
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

  // Function to create explosion effect and play explosion sound
  explode(x: number, y: number) {
    this.explosionParticles.explode(50, x, y);
    this.scene.cameras.main.shake(500, .01);
    this.explosionSound.play();
  }

  // Method to highlight a square when hovered over
  highlightSquare(square: Square | null) {
    if (!square) {
      this.pointerTileIndicator.visible = false;
      return;
    }
    const { x, y } = squareToWorldXY(square, this.chessboardTilemapLayer);
    this.pointerTileIndicator.setPosition(x, y)
      .setVisible(true);
  }

  // Method to select a square
  selectSquare(square: Square) {
    const { x, y } = squareToWorldXY(square, this.chessboardTilemapLayer);
    this.selectedTileIndicator.setPosition(x, y)
      .setVisible(true);
  }

  // Method to deselect a square
  deselectSquare() {
    this.selectedTileIndicator.visible = false;
  }

  // Method to indicate movable squares
  indicateMovableSquares(squares: Square[]) {
    squares.forEach(square => this.moveIndicators[square].visible = true);
  }

  // Method to indicate capturable squares
  indicateCapturableSquares(squares: Square[]) {
    squares.forEach(square => this.captureIndicators[square].visible = true);
  }

  // Method to hide all action indicators
  hideActionIndicators() {
    for (const square of CHESSBOARD_SQUARES) {
      this.captureIndicators[square].visible = false;
      this.moveIndicators[square].visible = false;
    }
  }

  // Method to update GUI based on game actions
  update({ actions }: MoveData) {
    for (const { move: { from, to }, explode } of actions) {
      const sprite = this.sprites[from];
      if (!sprite) continue;
      const { x, y } = squareToWorldXY(to, this.chessboardTilemapLayer);
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


  // Method to promote a chess piece sprite
  promoteSprite(square: Square, piece: PromotablePiece) {
    this.sprites[square]?.promote(piece);
  }
}

// Function to create chessboard tilemap
function createChessboard(scene: Scene, tileSize: number): { map: Tilemaps.Tilemap, layer: Tilemaps.TilemapLayer } {
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
  const { x, y } = layer.getBottomRight();
  layer.setPosition(-.5 * x, -.5 * y);
  return { map: map, layer: layer };
}

// Function to create an outlined square to indicate a tile
function createTileMarker(scene: Scene, tileSize: number, lineWidth: number, color: number, alpha: number): GameObjects.Graphics {
  return scene.add.graphics()
    .lineStyle(lineWidth, color, alpha)
    .strokeRect(0, 0, tileSize, tileSize);
}

// Function to create a small circle to indicate a move
function createMoveMarker(scene: Scene, x: number, y: number, size: number): GameObjects.Graphics {
  return scene.add.graphics()
    .fillStyle(0x000000, .3)
    .fillCircle(x, y, size)
    .setActive(false);
}

// Function to create an outlined circle to indicate a capture
function createCaptureMarker(scene: Scene, x: number, y: number, lineWidth: number, size: number): GameObjects.Graphics {
  return scene.add.graphics()
    .lineStyle(lineWidth, 0x000000, .3)
    .strokeCircle(x, y, size)
    .setActive(false);
}

// Function to create a sprite for a chess piece
function createChessPieceSprite(scene: Scene, piece: Piece, x: number, y: number): ChessPiece {
  return scene.add.existing(new ChessPiece(scene, PIECE_TO_TEXTURE_FRAME[piece], x, y));
}

// Function to create sprites for all chess pieces based on the specified board
function createChessPieceSprites(scene: Scene, tilemapLayer: Tilemaps.TilemapLayer, container: GameObjects.Container, board: Chessboard): Record<Square, ChessPiece | null> {
  const sprites: Record<Square, ChessPiece | null> = {} as Record<Square, ChessPiece | null>;
  for (const square of CHESSBOARD_SQUARES) {
    const piece = board[square];
    if (!piece) {
      sprites[square] = null;
      continue;
    }
    const { x, y } = squareToWorldXY(square, tilemapLayer);
    const sprite = createChessPieceSprite(scene, piece, x, y);
    sprites[square] = sprite;
    container.add(sprite);
  }
  return sprites;
}