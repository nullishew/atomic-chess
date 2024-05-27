import { Scene, Tilemaps, GameObjects, Sound } from "phaser";
import { ASSETS, PIECE_TO_TEXTURE_FRAME } from "../assets";
import { ChessPiece } from "./ChessPieceSprite";
import { Color, GameOverType, X88Chessboard, X88_TO_SQUARE, Piece, Square, INITIAL_X88CHESSBOARD_POSITION, PromotablePiece, PROMOTABLE_PIECES, MoveResult, MoveType, CASTLE_MOVES, X88, getFile, getRank } from "./AtomicChess";


// Define a class to manage the graphical user interface of an atomic chess game
export class AtomicChessGUI {
  scene: Scene; // Scene the gui is part of

  chessboard: Tilemaps.Tilemap; // Tilemap to create tilemap layers
  chessboardTileLayer: Tilemaps.TilemapLayer; // Tilemap layer to display chessboard squares and map squares to world positions
  moveIndicatorLayer: Tilemaps.TilemapLayer;
  captureIndicatorLayer: Tilemaps.TilemapLayer;

  chessPieces: (ChessPiece | null)[]; // Map squares to corresponding chess piece sprites

  pointerTileOutline: GameObjects.Rectangle; // Graphics objects to indicate the tile currently hovered over by the pointer
  selectedTileOutline: GameObjects.Rectangle; // Graphics objects to indicate the selected tile

  explosionParticles: GameObjects.Particles.ParticleEmitter; // Explosion particles
  explosionSound: Sound.NoAudioSound | Sound.HTML5AudioSound | Sound.WebAudioSound; // Explosion sound

  pieceMoveTime: number; // Duration of animation for moving and exploding pieces

  promotionMenus: Record<Color, GameObjects.Container>;
  gameOverMenus: Record<GameOverType, GameObjects.Container>;

  addTileOutline() {
    const tileSize = this.chessboard.tileHeight;
    return this.scene.add.rectangle(0, 0, tileSize, tileSize).setStrokeStyle(tileSize * .125, 0xffffff, 1)
      .setOrigin(0)
      .setVisible(false);
  }

  addChessboard(tileSize: number) {
    const tileData = [
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0]
    ];
    const map = this.scene.make.tilemap({ data: tileData, tileWidth: tileSize, tileHeight: tileSize });
    const chessSquareTileset = map.addTilesetImage(ASSETS.CHESSBOARD_TILES.key) as Tilemaps.Tileset;
    const x = -4 * tileSize;
    const y = -4 * tileSize;
    const chessTileLayer = map.createLayer(0, chessSquareTileset, x, y) as Tilemaps.TilemapLayer;
    const captureTileset = map.addTilesetImage(ASSETS.CHESS_CAPTURE_INDICATOR.key) as Tilemaps.Tileset;
    const captureIndicatorLayer = (map.createBlankLayer('Capture Indicators', captureTileset, x, y) as Tilemaps.TilemapLayer)
      .fill(0, 0, 0, 8, 8);
    const moveTileset = map.addTilesetImage(ASSETS.CHESS_MOVE_INDICATOR.key) as Tilemaps.Tileset;
    const moveIndicatorLayer = (map.createBlankLayer('Move Indicators', moveTileset, x, y) as Tilemaps.TilemapLayer)
      .fill(0, 0, 0, 8, 8);
    return { map: map, chessTileLayer: chessTileLayer, captureIndicatorLayer: captureIndicatorLayer, moveIndicatorLayer: moveIndicatorLayer };
  }

  addChessboardOutline(lineWidth: number, glowStrength: number, glowDistance: number) {
    const { width, height } = this.chessboardTileLayer;
    const outline = this.scene.add.rectangle(0, 0, width + lineWidth, height + lineWidth, 0x252525);
    outline.postFX.addGlow(0xffffff, glowStrength, 0, false, 1, glowDistance);
    return outline;
  }

  // Function to create sprites for all chess pieces based on the specified board
  addChessPieces(board: X88Chessboard) {
    const container = this.scene.add.container();
    const sprites = board.map((piece, index) => {
      if (!piece) return null;
      const { x, y } = this.x88ToWorldXY(index);
      const sprite = this.scene.add.existing(new ChessPiece(this.scene, PIECE_TO_TEXTURE_FRAME[piece], x, y));
      container.add(sprite);
      return sprite;
    });
    return { container: container, sprites: sprites };
  }

  constructor({ scene, tileSize, pieceMoveTime, gameOverMenuCallback: gameOverCallback }: { scene: Scene; tileSize: number; pieceMoveTime: number; gameOverMenuCallback: () => any; }) {
    this.scene = scene;

    this.pieceMoveTime = pieceMoveTime;

    // Center game view
    scene.cameras.main.centerOn(0, 0);

    // Add chessboard
    ({
      map: this.chessboard,
      chessTileLayer: this.chessboardTileLayer,
      captureIndicatorLayer: this.captureIndicatorLayer,
      moveIndicatorLayer: this.moveIndicatorLayer
    } = this.addChessboard(tileSize));

    const outline = this.addChessboardOutline(tileSize * .25, .125 * tileSize, .375 * tileSize);

    // Add chess pieces
    let chessPieceContainer;
    ({ sprites: this.chessPieces, container: chessPieceContainer } = this.addChessPieces(INITIAL_X88CHESSBOARD_POSITION));

    // Add tile indicators (mouse hover, selected)
    this.pointerTileOutline = this.addTileOutline();
    this.selectedTileOutline = this.addTileOutline();

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
      [GameOverType.WHITE_WIN]: this.createGameOverMenu('Winner:', [scene.add.image(0, 0, ASSETS.CHESS_PIECES.key, 0).setScale(2)], gameOverCallback).setVisible(false).setAlpha(0),
      [GameOverType.BLACK_WIN]: this.createGameOverMenu('Winner:', [scene.add.image(0, 0, ASSETS.CHESS_PIECES.key, 1).setScale(2)], gameOverCallback).setVisible(false).setAlpha(0),
      [GameOverType.DRAW]: this.createGameOverMenu('Draw', [], gameOverCallback).setVisible(false).setAlpha(0),
      [GameOverType.STALEMATE]: this.createGameOverMenu('Stalemate', [], gameOverCallback).setVisible(false).setAlpha(0),
    };

    // Define render order
    const gameLayer = scene.add.layer([
      outline,
      this.chessboardTileLayer,
      chessPieceContainer,
      this.pointerTileOutline,
      this.selectedTileOutline,
      this.moveIndicatorLayer,
      this.captureIndicatorLayer,
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
    const { x, y } = this.squareToWorldXY(square);
    const tileSize = this.chessboard.tileHeight;
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

  // Method to highlight a square when hovered over
  highlightSquare(square: Square | null) {
    if (!square) {
      this.pointerTileOutline.visible = false;
      return;
    }
    const { x, y } = this.squareToWorldXY(square);
    this.pointerTileOutline.setPosition(x, y)
      .setVisible(true);
  }

  // Method to select a square
  selectSquare(square: Square) {
    const { x, y } = this.squareToWorldXY(square);
    this.selectedTileOutline.setPosition(x, y)
      .setVisible(true);
  }

  // Method to deselect a square
  deselectSquare() {
    this.selectedTileOutline.visible = false;
  }

  indicateValidMoves({ captures, moves }: { captures: number[]; moves: number[]; }) {
    [this.captureIndicatorLayer, this.moveIndicatorLayer].flatMap(layer => layer.getTilesWithin(0, 0, 8, 8))
      .forEach(tile => tile?.setVisible(false));
    for (const square of captures) {
      const { x, y } = this.x88ToTileXY(square);
      this.captureIndicatorLayer.getTileAt(x, y)?.setVisible(true);
    }
    for (const square of moves) {
      const { x, y } = this.x88ToTileXY(square);
      this.moveIndicatorLayer.getTileAt(x, y)?.setVisible(true)
    }
  }

  movePiece(from: number, to: number) {
    const { x, y } = this.x88ToWorldXY(to);
    this.chessPieces[from]?.move(x, y, this.pieceMoveTime);
    this.chessPieces[to] = this.chessPieces[from];
    this.chessPieces[from] = null;
  }

  explodePiece(square: number) {
    const sprite = this.chessPieces[square];
    if (!sprite) return;
    this.chessPieces[square] = null;
    this.scene.time.addEvent({
      delay: this.pieceMoveTime,
      callback: () => {
        const { x, y } = sprite;
        sprite.explode();
        this.explosionParticles.explode(50, x, y);
        this.scene.cameras.main.shake(500, .01);
        this.explosionSound.play();
      }
    });
  }

  // Method to update GUI based on game actions
  update({ color, type: moveType, captures, explode, from, to }: MoveResult) {
    captures?.forEach(this.explodePiece.bind(this));
    if (moveType == MoveType.KINGSIDE_CASTLE || moveType == MoveType.QUEENSIDE_CASTLE) {
      const { kingMove, rookMove } = CASTLE_MOVES[color][moveType];
      this.movePiece(kingMove.from, kingMove.to);
      this.movePiece(rookMove.from, rookMove.to);
    } else {
      this.movePiece(from, to);
      if (explode) {
        this.explodePiece(to);
      }
    }
  }

  showGameOverMenu(gameOverType: GameOverType) {
    this.scene.tweens.add({
      targets: this.gameOverMenus[gameOverType].setVisible(true),
      duration: 1000,
      delay: 1000,
      alpha: { from: 0, to: 1 },
      ease: 'sine.in',
    });
  }

  promoteSprite(square: Square, piece: PromotablePiece) {
    this.chessPieces[X88[square]]?.promote(piece);
  }




  // spaghetti units
  squareToTileXY(square: Square): Phaser.Types.Math.Vector2Like {
    return this.x88ToTileXY(X88[square]);
  }

  tileXYToSquare(x: number, y: number): Square | null {
    return X88_TO_SQUARE[this.tileXYToX88(x, y)] ?? null;
  }

  tileXYToX88(x: number, y: number): number {
    return 16 * (7 - y) + x;
  }

  x88ToTileXY(square: number): Phaser.Types.Math.Vector2Like {
    return { x: getFile(square), y: 7 - getRank(square) };
  }

  x88ToWorldXY(square: number): Phaser.Types.Math.Vector2Like {
    const { x, y } = this.x88ToTileXY(square);
    return this.chessboardTileLayer.tileToWorldXY(x, y);
  }

  squareToWorldXY(square: Square): Phaser.Math.Vector2 {
    const { x, y } = this.squareToTileXY(square);
    return this.chessboardTileLayer.tileToWorldXY(x, y);
  }

  worldXYToSquare(x: number, y: number): Square | null {
    const { x: tileX, y: tileY } = this.chessboardTileLayer.worldToTileXY(x, y);
    return this.tileXYToSquare(tileX, tileY);
  }

  worldXYToIndex(x: number, y: number): number {
    const { x: f, y: r } = this.chessboardTileLayer.worldToTileXY(x, y);
    return 16 * (7 - r) + f;
  }

}
