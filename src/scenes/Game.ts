import { Scene, Tilemaps, GameObjects, Sound } from "phaser";
import { ASSETS, PIECE_TO_TEXTURE_FRAME } from "../assets";
import { chessTileSize } from "../main";
import { Square, Color, PIECE_TO_COLOR, MoveType, GameOverType, PromotablePiece, INITIAL_GAMESTATE, squareToTileIndex, squareToWorldXY, worldXYToSquare, Move, CHESSBOARD_SQUARES } from "../chess/atomicChessData";
import { AtomicChess } from "../chess/AtomicChess";
import { getAllValidMovesFrom, getValidStandardCapturesFrom } from "../chess/validator/atomicChessValidator";

// Game scene class definition
export class Game extends Scene {
  chessboardTilemap: Tilemaps.Tilemap;

  pointerTileMarker: GameObjects.Graphics;
  selectedTileMarker: GameObjects.Graphics;

  actionMarkers: {
    container: GameObjects.Container,
    moveMarkers: Record<Square, GameObjects.Graphics>,
    captureMarkers: Record<Square, GameObjects.Graphics>,
  };

  promotionMenus: Record<Color, GameObjects.Container>;
  gameOverMenus: Record<GameOverType, GameObjects.Container>;

  explosionSound: Sound.NoAudioSound | Sound.HTML5AudioSound | Sound.WebAudioSound;
  explosionParticles: GameObjects.Particles.ParticleEmitter;

  chess: AtomicChess;
  selectedSquare: Square | null;
  promotionSquare: Square;
  isGameOver: boolean;

  pointerSquare: Square | null;

  constructor() {
    super('Game'); // Call to superclass constructor with scene key
  }

  // Scene creation method
  create() {
    // Fade in camera
    this.cameras.main.fadeIn(3000, 0, 0, 0);

    // Initialize game over status
    this.isGameOver = false;

    // Center game view
    const cam = this.cameras.main;
    const { centerX, centerY } = cam;
    cam.setScroll(-centerX, -centerY);

    // Create chessboard ui
    this.chessboardTilemap = createChessboard(this, chessTileSize);

    // Initialize atomic chess game
    this.chess = new AtomicChess(INITIAL_GAMESTATE, this, this.add.container());

    this.addIndicators();

    this.explosionParticles = this.add.particles(0, 0, ASSETS.PARTICLE.key, {
      speed: { min: 300, max: 600 },
      scale: { start: .6, end: 0, random: true },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 300, max: 600 },
      emitting: false,
    });

    this.explosionSound = this.sound.add(ASSETS.EXPLOSION.key);

    this.createMenus();

    this.setupMouseInput();

  }

  // Create promotion and game over menus
  createMenus() {
    this.promotionMenus = {
      [Color.WHITE]: createPromotionMenu(this, Color.WHITE).setVisible(false),
      [Color.BLACK]: createPromotionMenu(this, Color.BLACK).setVisible(false),
    }

    this.gameOverMenus = {
      [GameOverType.WHITE_WIN]: createGameOverMenu(this, 'Winner:', this.add.image(0, 0, ASSETS.CHESS_PIECES.key, 0).setScale(2)).setVisible(false),
      [GameOverType.BLACK_WIN]: createGameOverMenu(this, 'Winner:', this.add.image(0, 0, ASSETS.CHESS_PIECES.key, 1).setScale(2)).setVisible(false),
      [GameOverType.DRAW]: createGameOverMenu(this, 'Draw', null).setVisible(false),
      [GameOverType.STALEMATE]: createGameOverMenu(this, 'Stalemate', null).setVisible(false)
    }
  }

  // Add UI indicators
  addIndicators() {
    this.pointerTileMarker = createTileMarker(this, chessTileSize, chessTileSize * .1, 0xffffff, 1).setVisible(false);
    this.selectedTileMarker = createTileMarker(this, chessTileSize, chessTileSize * .1, 0xffffff, 1).setVisible(false);
    this.actionMarkers = createActionMarkers(this, this.add.container().setVisible(false));
  }

  // Setup mouse input handlers
  setupMouseInput() {
    // Add pointer input to keep track of the square the pointer is currently hovering over
    this.input.on('pointermove', () => {
      const { x, y } = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.pointerSquare = worldXYToSquare(x, y, this.chessboardTilemap);
    });

    // Add pointer input to indicate the square the pointer is currently hovering over
    this.input.on('pointermove', () => {
      if (this.isGameOver) return;
      if (!this.pointerTileMarker) return;
      const { pointerSquare } = this;
      if (!pointerSquare) {
        this.pointerTileMarker.visible = false;
        return;
      }
      const { x, y } = squareToWorldXY(pointerSquare, this.chessboardTilemap);
      this.pointerTileMarker.setPosition(x, y)
        .setVisible(true);
    });

    // Add pointer input to select squares and make moves
    this.input.on('pointerdown', () => {
      if (this.isGameOver) return;
      const { pointerSquare } = this;
      if (!pointerSquare) {
        this.deselectSquare();
        return;
      }
      const { activeColor, board } = this.chess.data;
      const piece = board[pointerSquare];
      if (piece && PIECE_TO_COLOR[piece] == activeColor) {
        this.selectSquare(pointerSquare);
        return;
      }
      if (!this.selectedSquare) return;
      this.tryMove({ from: this.selectedSquare, to: pointerSquare });
    });
  }

  // Attempt to make a move
  tryMove(move: Move) {
    const { to } = move;
    this.deselectSquare();
    const { activeColor } = this.chess.data;
    const moveType = this.chess.tryMove(move);
    if (!moveType) return;
    if (moveType == MoveType.PROMOTION) {
      this.promotionSquare = to;
      this.promotionMenus[activeColor].visible = true;
    }
    this.tryGameOver();
  }

  // Check for game over condition
  tryGameOver() {
    const gameOverType = this.chess.tryGameOver();
    if (!gameOverType) return;
    this.isGameOver = true;
    const menu = this.gameOverMenus[gameOverType];
    menu.visible = true;
    menu.alpha = 0;
    this.tweens.add({
      targets: menu,
      duration: 1000,
      delay: 1000,
      alpha: 1,
      ease: 'sine.in',
    });
  }

  // Select a square
  selectSquare(square: Square) {
    this.selectedSquare = square;
    const { x, y } = squareToWorldXY(square, this.chessboardTilemap);
    this.selectedTileMarker.setPosition(x, y)
      .setVisible(true);
    this.showValidMoves(square);
  }

  // Deselect a square
  deselectSquare() {
    this.hideActionMarkers();
    this.selectedTileMarker.visible = false;
    this.selectedSquare = null;
  }

  // Show valid moves from a square
  showValidMoves(from: Square) {
    this.hideActionMarkers();
    this.actionMarkers.container.visible = true;
    getAllValidMovesFrom(this.chess.data, from).forEach(to => this.actionMarkers.moveMarkers[to].visible = true);
    getValidStandardCapturesFrom(this.chess.data, from).forEach(to => {
      this.actionMarkers.moveMarkers[to].visible = false;
      this.actionMarkers.captureMarkers[to].visible = true;
    });
  }

  // Hide action markers
  hideActionMarkers() {
    this.actionMarkers.container.visible = false;
    CHESSBOARD_SQUARES.forEach(square => {
      this.actionMarkers.moveMarkers[square].visible = false;
      this.actionMarkers.captureMarkers[square].visible = false;
    });
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
function createMoveMarker(scene: Game, x: number, y: number, size: number): GameObjects.Graphics {
  return scene.add.graphics()
    .fillStyle(0x000000, .3)
    .fillCircle(x, y, size)
    .setActive(false);
}

// Function to create a capture marker
function createCaptureMarker(scene: Game, x: number, y: number, lineWidth: number, size: number): GameObjects.Graphics {
  return scene.add.graphics()
    .lineStyle(lineWidth, 0x000000, .3)
    .strokeCircle(x, y, size)
    .setActive(false);
}

// Function to create action markers
function createActionMarkers(scene: Game, container: GameObjects.Container): {
  container: GameObjects.Container,
  moveMarkers: Record<Square, GameObjects.Graphics>,
  captureMarkers: Record<Square, GameObjects.Graphics>,
} {
  const moveMarkers: Record<Square, GameObjects.Graphics> = {} as Record<Square, GameObjects.Graphics>;
  const captureMarkers: Record<Square, GameObjects.Graphics> = {} as Record<Square, GameObjects.Graphics>;
  CHESSBOARD_SQUARES.forEach(square => {
    let { x, y } = squareToWorldXY(square, scene.chessboardTilemap);
    x += .5 * chessTileSize;
    y += .5 * chessTileSize;
    moveMarkers[square] = createMoveMarker(scene, x, y, .1 * chessTileSize);
    captureMarkers[square] = createCaptureMarker(scene, x, y, .125 * chessTileSize, .4375 * chessTileSize);
    container.add(moveMarkers[square]);
    container.add(captureMarkers[square]);
  });
  return {
    container: container,
    moveMarkers: moveMarkers,
    captureMarkers: captureMarkers,
  };
}

// Function to create promotion menu
function createPromotionMenu(game: Game, color: Color): GameObjects.Container {
  const container = game.add.container(0, 0);
  const background = game.add.graphics()
    .fillStyle(color == Color.WHITE ? 0x000000 : 0xffffff, 1)
    .fillRect(-64, -16, 128, 32);
  const pieceOptions: Record<Color, PromotablePiece[]> = {
    [Color.WHITE]: ['Q', 'B', 'N', 'R'],
    [Color.BLACK]: ['q', 'b', 'n', 'r'],
  };
  const buttons = pieceOptions[color].map(
    (piece, i) => game.add.image((i - 1.5) * 32, 0, ASSETS.CHESS_PIECES.key, PIECE_TO_TEXTURE_FRAME[piece])
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        container.visible = false;
        game.chess.promote(game.promotionSquare, piece);
        game.tryGameOver();
      })
  );
  return container.add([background, ...buttons]);
}

// Function to create game over menu
function createGameOverMenu(game: Scene, text: string, image: GameObjects.Image | null): GameObjects.Container {
  const container = game.add.container(0, 0);
  const background = game.add.graphics()
    .fillStyle(0xfffffff, .75)
    .fillRect(-64, -64, 128, 128);
  const textElem = game.add.text(0, -32, text, { color: 'black', fontFamily: 'Pixelify Sans', fontSize: 24 })
    .setResolution(32)
    .setOrigin(.5);
  const button = game.add.image(0, 32, ASSETS.RETRY.key)
    .setScale(1)
    .setOrigin(.5)
    .setInteractive({ useHandCursor: true })
    .once('pointerdown', () => {
      game.cameras.main.fadeOut(1000, 0, 0, 0);
      game.time.addEvent({
        delay: 1000,
        callback: () => game.scene.restart(),
      });
    });
  return container.add([
    background,
    textElem,
    image ?? game.add.container(),
    button,
  ]);
}

