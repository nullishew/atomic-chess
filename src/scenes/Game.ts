import { Scene, Tilemaps, GameObjects, Sound } from "phaser";
import { ASSETS } from "../assets";
import { AtomicChess, GameOverType, PromotablePieceNotation } from "../chess/AtomicChess";
import { Pos, Color, PIECE_TO_COLOR, MoveType, getValidMovesFrom, Piece } from "../chess/validator/atomicChessValidator";
import { Square, CHESSBOARD_SETUP, getSquareAtIndex, SQUARE_TO_INDEX, SquareIndex } from "../chess/validator/atomicChessboard";
import { chessTileSize } from "../main";



export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;

  chessboardMap: Tilemaps.Tilemap;

  selectedTile: Tilemaps.Tile | null;

  pointerTileMarker: GameObjects.Graphics;
  selectedTileMarker: GameObjects.Graphics;
  moveMarkers: GameObjects.Graphics[][];

  chess: AtomicChess;

  fromTile: Pos | null;
  fromSquare: Square | null;

  debugText: GameObjects.Text;
  explosionSound: Sound.NoAudioSound | Sound.HTML5AudioSound | Sound.WebAudioSound;
  explosionParticles: GameObjects.Particles.ParticleEmitter;

  promotionSquare: Square;
  promotionMenus: Record<Color, GameObjects.Container>;
  gameOverMenus: Record<GameOverType, GameObjects.Container>;

  isGameOver: boolean;

  constructor() {
    super('Game');
  }

  get pointerPos() { return this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2 }

  get pointerTile() {
    const { x, y } = this.pointerPos;
    return this.chessboardMap.getTileAtWorldXY(x, y);
  }

  get pointerTileWorldPos() {
    const tile = this.pointerTile;
    if (!tile) return null;
    const { x, y } = tile;
    return this.chessboardMap.tileToWorldXY(x, y) as Phaser.Math.Vector2;
  }

  create() {
    // Fade in transition
    this.cameras.main.fadeIn(3000, 0, 0, 0);

    // Reset game state
    this.isGameOver = false;

    // Center gameview
    const cam = this.cameras.main;
    const { centerX, centerY } = cam;
    cam.setScroll(-centerX, -centerY);

    // Create explosion sound
    this.explosionSound = this.sound.add(ASSETS.EXPLOSION.key);

    // Create chessboard
    this.chessboardMap = createChessboard(this, chessTileSize);

    this.chess = new AtomicChess(
      {
        board: CHESSBOARD_SETUP,
        activeColor: Color.WHITE,
        canCastle: {
          [Color.WHITE]: { kingside: true, queenside: true },
          [Color.BLACK]: { kingside: true, queenside: true },
        },
        enPassantTargets: [],
        fullMoves: 0,
        halfMoves: 0
      },
      this,
      this.add.container()
    );

    // Add indicator to indicate tile hovered over by mouse
    this.pointerTileMarker = createTileMarker(this, chessTileSize, chessTileSize * .1, 0xffffff, 1);

    // Add indicator to indicate selected tile
    this.selectedTileMarker = createTileMarker(this, chessTileSize, chessTileSize * .1, 0xffffff, 1);

    // Create markers to indicate possible moves
    this.moveMarkers = Array(8).fill(null).map(() => Array(8).fill(null)).map((row, r) => row.map(
      (_, c) => createMoveMarker(this, this.chessboardMap, r, c, .1 * chessTileSize)
    ));

    // Create menus for pawn promotions
    this.promotionMenus = {
      [Color.WHITE]: createPromotionMenu(this, Color.WHITE).setVisible(false),
      [Color.BLACK]: createPromotionMenu(this, Color.BLACK).setVisible(false),
    }

    // Create menus for when the game ends
    this.gameOverMenus = {
      [GameOverType.WHITE_WIN]: createGameOverMenu(this, 'Winner:', this.add.image(0, 0, ASSETS.CHESS_PIECES.key, 0).setScale(2)).setVisible(false),
      [GameOverType.BLACK_WIN]: createGameOverMenu(this, 'Winner:', this.add.image(0, 0, ASSETS.CHESS_PIECES.key, 1).setScale(2)).setVisible(false),
      [GameOverType.DRAW]: createGameOverMenu(this, 'Draw', null).setVisible(false),
      [GameOverType.STALEMATE]: createGameOverMenu(this, 'Stalemate', null).setVisible(false)
    }

    // Add explosion particles
    this.explosionParticles = this.add.particles(0, 0, ASSETS.PARTICLE.key, {
      speed: { min: 300, max: 600 },
      scale: { start: .6, end: 0, random: true },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 300, max: 600 },
      emitting: false,
    });

    this.setUpInput();
  }

  setUpInput() {
    // Add mouse input to indicate which tile the mouse is currently hovering over
    this.input.on('pointermove', () => {
      if (this.isGameOver) return;
      if (!this.pointerTileMarker) return;
      const tile = this.pointerTile;
      if (!tile) {
        this.pointerTileMarker.visible = false;
        return;
      }
      const { x, y } = this.chessboardMap.tileToWorldXY(tile.x, tile.y) as Phaser.Math.Vector2;
      this.pointerTileMarker.visible = true;
      this.pointerTileMarker.setPosition(x, y);
    });

    // Add mouse input to select tiles and make moves
    this.input.on('pointerdown', () => {
      if (this.isGameOver) return;
      const deselectTile = () => {
        this.hideMoveMarkers();
        this.selectedTileMarker.visible = false;
        this.selectedTile = null;
        this.fromTile = null;
        this.fromSquare = null;
      }
      const selectTile = (pos: Pos, square: Square) => {
        this.fromTile = pos;
        this.fromSquare = square;
        const [r, c] = pos;
        const { x, y } = this.chessboardMap.tileToWorldXY(c, r) as Phaser.Math.Vector2;
        this.selectedTileMarker.setPosition(x, y);
        this.selectedTileMarker.visible = true;
        this.showValidMoves(square);
      }
      const tile = this.pointerTile;
      if (!tile) {
        deselectTile();
        return;
      }
      const { x, y } = tile;
      const pos: Pos = [y, x];
      const { activeColor, board } = this.chess.data;
      const index = getSquareIndexAtTile(pos);
      if (!index) return;
      const square = getSquareAtIndex(index);
      const piece = board[square];
      if (piece && PIECE_TO_COLOR[piece] == activeColor) {
        selectTile(pos, square);
        return;
      }
      if (!this.fromSquare) return;
      const move = { from: this.fromSquare, to: square };
      deselectTile();
      const moveType = this.chess.tryMove(move);
      if (!moveType) return;
      if (moveType == MoveType.PROMOTION) {
        console.log('promotion!');
        this.promotionSquare = square;
        this.promotionMenus[activeColor].visible = true;
      }
      
      const gameOverType = this.chess.tryGameOver();
      if (!gameOverType) return;
      this.isGameOver = true;
      console.log(gameOverType);
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
    });
  }

  // Show indicators to indicate all possible moves of a chess piece at a given location
  showValidMoves(square: Square) {
    this.hideMoveMarkers();
    getValidMovesFrom(this.chess.data, square)
      .forEach(to => {
        const [r, c] = getTileIndexAtSquareIndex(SQUARE_TO_INDEX[to]);
        const marker = this.moveMarkers[r][c];
        this.children.bringToTop(marker);
        marker.visible = true;
      });
  }

  // Hide all move indicators
  hideMoveMarkers() {
    this.moveMarkers.flat().forEach(marker => marker.visible = false);
  }


}

// Factory method to create a chessboard tilemap
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
  const { x, y } = layer.getBottomRight() as Phaser.Math.Vector2;
  layer.setPosition(-.5 * x, -.5 * y);
  return map;
}

// Factory method to create a tile marker
function createTileMarker(scene: Scene, tileSize: number, lineWidth: number, color: number, alpha: number): GameObjects.Graphics {
  const marker = scene.add.graphics();
  marker.lineStyle(lineWidth, color, alpha);
  marker.strokeRect(0, 0, tileSize, tileSize);
  marker.visible = false;
  return marker;
}

// Factory method to create a movement marker
function createMoveMarker(scene: Scene, tilemap: Tilemaps.Tilemap, r: number, c: number, size: number): GameObjects.Graphics {
  const { x, y } = tilemap.tileToWorldXY(c + .5, r + .5) as Phaser.Math.Vector2;
  const graphics = scene.add.graphics()
    .fillStyle(0x808080, .5)
    .fillCircle(x, y, size)
    .setActive(false)
    .setVisible(false);
  return graphics;
}

export const PIECE_TO_TEXTURE_FRAME: Record<Piece, number> = {
  k: 1,
  q: 3,
  b: 5,
  n: 7,
  r: 9,
  p: 11,
  K: 0,
  Q: 2,
  B: 4,
  N: 6,
  R: 8,
  P: 10
};



// Factory method to create a pawn promotion menu
function createPromotionMenu(game: Game, color: Color): GameObjects.Container {
  const container = game.add.container(0, 0);
  const background = game.add.graphics()
    .fillStyle(color == Color.WHITE ? 0x000000 : 0xffffff, 1)
    .fillRect(-64, -16, 128, 32);
  const pieceOptions: Record<Color, PromotablePieceNotation[]> = {
    [Color.WHITE]: ['Q', 'B', 'N', 'R'],
    [Color.BLACK]: ['q', 'b', 'n', 'r'],
  };
  const buttons = pieceOptions[color].map(
    (piece, i) => game.add.image((i - 1.5) * 32, 0, ASSETS.CHESS_PIECES.key, PIECE_TO_TEXTURE_FRAME[piece])
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        game.chess.promote(game.promotionSquare, piece);
        container.visible = false;
      })
  );
  return container.add([background, ...buttons]);
}

// Factory method to create a game over menu
function createGameOverMenu(game: Scene, text: string, image: GameObjects.Image | null): GameObjects.Container {
  const button = game.add.image(0, 32, ASSETS.RETRY.key)
    .setScale(1)
    .setOrigin(.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      button.removeAllListeners();
      game.cameras.main.fadeOut(1000, 0, 0, 0);
      game.time.addEvent({
        delay: 1000,
        callback: () => game.scene.restart(),
      });
    });
  const container = game.add.container(0, 0, [
    game.add.graphics()
      .fillStyle(0xfffffff, .75)
      .fillRect(-64, -64, 128, 128),
    game.add.text(0, -32, text, { color: 'black', fontFamily: 'Pixelify Sans', fontSize: 24 })
      .setResolution(32)
      .setOrigin(.5),
    image ?? game.add.graphics(),
    button,
  ]);
  return container;
}


function getSquareIndexAtTile([r, c]: Pos): SquareIndex | null {
  if (r < 0 || r > 7 || c < 0 || c > 7) return null;
  return [7 - r, c] as SquareIndex;
}

export function getTileIndexAtSquareIndex(index: SquareIndex): Pos {
  const [r, c] = index;
  return [7 - r, c];
}