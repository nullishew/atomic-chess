import { Scene, Tilemaps, GameObjects, Sound } from "phaser";
import { Square, CHESSBOARD_SQUARES, Piece, Chessboard, INITIAL_CHESSBOARD_POSITION, PromotablePiece, Color, GameOverType, PROMOTABLE_PIECES, moveSquare } from "./atomicChess";
import { squareToWorldXY } from "../scenes/Game";
import { ASSETS, PIECE_TO_TEXTURE_FRAME } from "../assets";
import { ChessPiece } from "./ChessPieceSprite";
import { ExternalMove } from "./validator";

// Define a class to manage the graphical user interface of an atomic chess game
export class AtomicChessGUI {
  scene: Scene; // Scene the gui is part of
  chessboardTilemap: Tilemaps.Tilemap; // Tilemap to create tilemap layers
  chessboardTilemapLayer: Tilemaps.TilemapLayer; // Tilemap layer to display chessboard squares and map squares to world positions
  sprites: Record<Square, ChessPiece | null>; // Map squares to corresponding chess piece sprites
  pointerTileIndicator: GameObjects.Rectangle; // Graphics objects to indicate the tile currently hovered over by the pointer
  selectedTileIndicator: GameObjects.Rectangle; // Graphics objects to indicate the selected tile
  moveIndicators: Record<Square, GameObjects.Arc>; // Graphics objects to indicate possible moves that are not direct captures
  captureIndicators: Record<Square, GameObjects.Arc>;  // Graphics objects to indicate possible direct captures
  explosionSound: Sound.NoAudioSound | Sound.HTML5AudioSound | Sound.WebAudioSound; // Explosion sound
  explosionParticles: GameObjects.Particles.ParticleEmitter; // Explosion particles
  pieceMoveTime: number; // Duration of animation for moving and exploding pieces
  promotionMenus: Record<Color, GameObjects.Container>;
  gameOverMenus: Record<GameOverType, GameObjects.Container>;

  constructor({ scene, tileSize, pieceMoveTime, gameOverMenuCallback: gameOverCallback }: { scene: Scene; tileSize: number; pieceMoveTime: number; gameOverMenuCallback: () => any; }) {
    this.scene = scene;

    this.pieceMoveTime = pieceMoveTime;

    // Center game view
    scene.cameras.main.centerOn(0, 0);


    // Add chessboard
    ({ map: this.chessboardTilemap, layer: this.chessboardTilemapLayer } = createChessboard(this.scene, tileSize));

    const { width, height } = this.chessboardTilemapLayer;
    const size = tileSize * .25;
    const outline = scene.add.rectangle(0, 0, width + size, height + size, 0x252525);
    outline.postFX.addGlow(0xffffff, .125 * tileSize, 0, false, 1, .375 * tileSize);

    // Add chess pieces
    const chessPieceContainer = scene.add.container();
    this.sprites = createChessPieceSprites(scene, this.chessboardTilemapLayer, chessPieceContainer, structuredClone(INITIAL_CHESSBOARD_POSITION));

    // Add tile indicators (mouse hover, selected)
    const tileIndicatorContainer = scene.add.container();
    this.pointerTileIndicator = scene.add.rectangle(0, 0, tileSize, tileSize).setStrokeStyle(tileSize * .125, 0xffffff, 1).setOrigin(0).setVisible(false);
    this.selectedTileIndicator = scene.add.rectangle(0, 0, tileSize, tileSize).setStrokeStyle(tileSize * .125, 0xffffff, 1).setOrigin(0).setVisible(false);
    tileIndicatorContainer.add([this.pointerTileIndicator, this.selectedTileIndicator]);

    // Add action indicators (move, capture)
    const actionIndicatorContainer = scene.add.container();
    this.captureIndicators = {} as Record<Square, GameObjects.Arc>;
    this.moveIndicators = {} as Record<Square, GameObjects.Arc>;
    for (const square of CHESSBOARD_SQUARES) {
      let { x, y } = squareToWorldXY(square, this.chessboardTilemapLayer);
      x += .5 * tileSize;
      y += .5 * tileSize;
      this.captureIndicators[square] = scene.add.circle(x, y, .4375 * tileSize)
        .setStrokeStyle(.125 * tileSize, 0x000000, .3);
      this.moveIndicators[square] = scene.add.circle(x, y, .125 * tileSize, 0x000000, .3);
      actionIndicatorContainer.add([
        this.captureIndicators[square].setVisible(false),
        this.moveIndicators[square].setVisible(false)
      ]);
    }

    // Add explosion particles
    this.explosionParticles = scene.add.particles(0, 0, ASSETS.PARTICLE.key, {
      speed: { min: 300, max: 600 },
      scale: { start: .6, end: 0, random: true },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 300, max: 600 },
      emitting: false,
    });

    // Add explosion sound
    this.explosionSound = scene.sound.add(ASSETS.EXPLOSION.key);


    // Create menus for when the game ends
    this.gameOverMenus = {
      [GameOverType.WHITE_WIN]: this.createGameOverMenu('Winner:', [scene.add.image(0, 0, ASSETS.CHESS_PIECES.key, 0).setScale(2)], gameOverCallback).setVisible(false),
      [GameOverType.BLACK_WIN]: this.createGameOverMenu('Winner:', [scene.add.image(0, 0, ASSETS.CHESS_PIECES.key, 1).setScale(2)], gameOverCallback).setVisible(false),
      [GameOverType.DRAW]: this.createGameOverMenu('Draw', [], gameOverCallback).setVisible(false),
      [GameOverType.STALEMATE]: this.createGameOverMenu('Stalemate', [], gameOverCallback).setVisible(false)
    }

    // Define render order
    const gameLayer = scene.add.layer([
      outline,
      this.chessboardTilemapLayer,
      chessPieceContainer,
      tileIndicatorContainer,
      actionIndicatorContainer,
      this.explosionParticles
    ]);

    const menusLayer = scene.add.layer([
      this.gameOverMenus[GameOverType.WHITE_WIN],
      this.gameOverMenus[GameOverType.BLACK_WIN],
      this.gameOverMenus[GameOverType.DRAW],
      this.gameOverMenus[GameOverType.STALEMATE],
    ]);

  }

  // Method to create a promotion menu for pawns
  createPromotionMenu(color: Color, square: Square, callback: (piece: PromotablePiece) => any): GameObjects.Container {
    const scene = this.scene;
    const { x, y } = squareToWorldXY(square, this.chessboardTilemapLayer);
    const tileSize = this.chessboardTilemap.tileHeight;
    const container = scene.add.container(x, y);
    const buttonData = PROMOTABLE_PIECES[color].map((piece, i) => ({
      piece: piece,
      buttonY: (color == Color.WHITE ? 1 : -1) * i * tileSize
    }));
    const backgrounds = buttonData.map(({ buttonY }) => scene.add.graphics()
      .fillStyle(0x303c4f, 1)
      .fillRect(0, buttonY, tileSize, tileSize)
      .lineStyle(.125 * tileSize, 0x000000)
      .strokeRect(0, buttonY, tileSize, tileSize)
    );
    const buttons = buttonData.map(({ piece, buttonY }) => scene.add.image(0, buttonY, ASSETS.CHESS_PIECES.key, PIECE_TO_TEXTURE_FRAME[piece])
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .once('pointerdown', () => {
        callback(piece);
        container.destroy();
      })
    );
    return container.add(backgrounds)
      .add(buttons);
  }

  // Method to create a game over menu
  createGameOverMenu(text: string, elems: GameObjects.GameObject[], callback: () => any): GameObjects.Container {
    const scene = this.scene;
    const menu = scene.add.container(0, 0);
    // const background = scene.add.image(0, 0, ASSETS.MENU.key);
    const background = scene.add.graphics()
      .fillStyle(0xfffffff, .5)
      .fillRect(-64, -64, 128, 128);
    const textElem = scene.add.text(0, -32, text, { color: 'black', fontFamily: 'Super Dream', fontSize: 24 })
      .setResolution(48)
      .setOrigin(.5);
    const button = scene.add.image(0, 32, ASSETS.RETRY.key)
      .setOrigin(.5)
      .setInteractive({ useHandCursor: true })
      .once('pointerdown', callback);
    return menu.add([
      background,
      textElem,
      ...elems,
      button
    ]);
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

  indicateValidMoves({ captures, moves }: { captures: Square[]; moves: Square[]; }) {
    for (const square of CHESSBOARD_SQUARES) {
      this.captureIndicators[square].visible = false;
      this.moveIndicators[square].visible = false;
    }
    captures.forEach(square => this.captureIndicators[square].visible = true)
    moves.forEach(square => this.moveIndicators[square].visible = true);
  }

  // Method to update GUI based on game actions
  update({ actions }: ExternalMove) {
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
