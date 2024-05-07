import { Scene, Tilemaps, GameObjects, Sound } from "phaser";
import { Square, CHESSBOARD_SQUARES, squareToWorldXY, Piece, Chessboard, INITIAL_CHESSBOARD_POSITION, PromotablePiece, Move, MoveType } from "./atomicChess";
import { ASSETS, PIECE_TO_TEXTURE_FRAME } from "../assets";
import { ChessPiece } from "./ChessPieceSprite";
import { AtomicChessResponse } from "./chessboard";

export class AtomicChessGUI {
  scene: Scene;

  chessboardTilemap: Tilemaps.Tilemap;

  sprites: Record<Square, ChessPiece | null>;
  chessPieceContainer: GameObjects.Container;

  pointerTileIndicator: GameObjects.Graphics;
  selectedTileIndicator: GameObjects.Graphics;

  moveIndicators: Record<Square, GameObjects.Graphics>;
  captureIndicators: Record<Square, GameObjects.Graphics>;

  explosionSound: Sound.NoAudioSound | Sound.HTML5AudioSound | Sound.WebAudioSound;
  explosionParticles: GameObjects.Particles.ParticleEmitter;

  camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Scene, tileSize: number) {
    this.scene = scene;

    // Get reference to main camera
    this.camera = scene.cameras.main;

    // Add chessboard
    this.chessboardTilemap = createChessboard(this.scene, tileSize);

    // Add chess pieces
    this.chessPieceContainer = this.scene.add.container();
    this.sprites = createChessPieceSprites(scene, this, this.chessPieceContainer, structuredClone(INITIAL_CHESSBOARD_POSITION));


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

  pointerSquare(square: Square | null) {
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

  update(response: AtomicChessResponse) {
    const { explosions, moves, moveType } = response;
    console.log('fdsfsdfsdfsdfsdfsdfsdfasfasdfsad');
    if (moveType == MoveType.EN_PASSANT) {
      console.log('fdsdfsdfsdfsdfsdf oh no something broke');
      console.table(explosions);
      console.table(moves);
      console.log('what');
    }
    explosions.forEach(this.explosionUpdate);
    moves.forEach(this.moveUpdate);
    explosions.forEach(this.explosionUpdate);
  }

  explosionUpdate = (square: Square) => {
    this.sprites[square]?.explode();
    this.sprites[square] = null;
  }

  moveUpdate = ({ from, to }: Move) => {
    console.log('fdfsdfsd');
    this.sprites[from]?.move(to);
    this.sprites[to] = this.sprites[from];
    this.sprites[from] = null;
  }


  promote(square: Square, piece: PromotablePiece) {
    this.sprites[square]?.destroy();
    const sprite = createChessPieceSprite(this.scene, this, piece, square);
    this.chessPieceContainer.add(sprite);
    this.sprites[square] = sprite;
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


function createChessPieceSprite(scene: Scene, gui: AtomicChessGUI, piece: Piece, square: Square): ChessPiece {
  return scene.add.existing(new ChessPiece(gui, PIECE_TO_TEXTURE_FRAME[piece], square));
}

function createChessPieceSprites(scene: Scene, gui: AtomicChessGUI, container: GameObjects.Container, board: Chessboard): Record<Square, ChessPiece | null> {
  const sprites: Record<Square, ChessPiece | null> = {} as Record<Square, ChessPiece | null>;
  for (const square of CHESSBOARD_SQUARES) {
    const piece = board[square];
    if (!piece) {
      sprites[square] = null;
      continue;
    }
    const sprite = createChessPieceSprite(scene, gui, piece, square);
    sprites[square] = sprite;
    container.add(sprite);
  }
  return sprites;
}