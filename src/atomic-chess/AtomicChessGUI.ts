import { Scene, Tilemaps, GameObjects, Sound } from "phaser";
import { ASSETS, PIECE_TO_TEXTURE_FRAME } from "../assets";
import { ChessPiece } from "./ChessPieceSprite";
import { Color, GameOverType, X88Chessboard, X88_TO_SQUARE, Square, INITIAL_X88CHESSBOARD_POSITION, PromotablePiece, PROMOTABLE_PIECES, MoveResult, MoveType, CASTLE_MOVES, X88, getFile, getRank } from "./AtomicChess";


// Define a class to manage the graphical user interface of an atomic chess game
export class AtomicChessGUI {
  scene: Scene; // Scene the gui is part of

  chessboard: Tilemaps.Tilemap; // Tilemap to create tilemap layers
  chessboardTileLayer: Tilemaps.TilemapLayer; // Tilemap layer to display chessboard squares and map squares to world positions
  moveIndicatorLayer: Tilemaps.TilemapLayer;
  captureIndicatorLayer: Tilemaps.TilemapLayer;
  chessboardOutline: GameObjects.Rectangle;

  chessPieces: (ChessPiece | null)[]; // Map squares to corresponding chess piece sprites

  pointerTileOutline: GameObjects.Rectangle; // Graphics objects to indicate the tile currently hovered over by the pointer
  selectedTileOutline: GameObjects.Rectangle; // Graphics objects to indicate the selected tile

  explosionParticles: GameObjects.Particles.ParticleEmitter; // Explosion particles
  explosionSound: Sound.NoAudioSound | Sound.HTML5AudioSound | Sound.WebAudioSound; // Explosion sound

  pieceMoveTime: number; // Duration of animation for moving and exploding pieces

  promotionMenus: Record<Color, GameObjects.Container>;
  gameOverMenus: Record<GameOverType, GameObjects.Container>;


  constructor({ scene, tileSize, pieceMoveTime, gameOverMenuCallback: gameOverCallback }: { scene: Scene; tileSize: number; pieceMoveTime: number; gameOverMenuCallback: () => any; }) {
    this.scene = scene;

    this.pieceMoveTime = pieceMoveTime;

    // Center game view
    scene.cameras.main.centerOn(0, 0);

    // Create game elements
    this.createsChessboard(tileSize);
    this.createChessPieces(INITIAL_X88CHESSBOARD_POSITION);
    const chessPieceContainer = scene.add.container(0, 0, this.chessPieces.flatMap(sprite => sprite ?? []));

    // Create indicators to indicate game actions
    this.createMoveIndicators();
    this.pointerTileOutline = this.addTileOutline(tileSize);
    this.selectedTileOutline = this.addTileOutline(tileSize);

    // Create explosion particles
    this.explosionParticles = scene.add.particles(0, 0, ASSETS.PARTICLE.key, {
      speed: { min: 300, max: 600 },
      scale: { start: .6, end: 0, random: true },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 300, max: 600 },
      emitting: false,
    });

    // Create explosion sound
    this.explosionSound = scene.sound.add(ASSETS.EXPLOSION.key);

    // Create menus for when the game ends
    this.gameOverMenus = {
      [GameOverType.WHITE_WIN]: this.createGameOverMenu('Winner:', [scene.add.image(0, 0, ASSETS.CHESS_PIECES.key, 0).setScale(2)], gameOverCallback).setVisible(false).setAlpha(0),
      [GameOverType.BLACK_WIN]: this.createGameOverMenu('Winner:', [scene.add.image(0, 0, ASSETS.CHESS_PIECES.key, 1).setScale(2)], gameOverCallback).setVisible(false).setAlpha(0),
      [GameOverType.DRAW]: this.createGameOverMenu('Draw', [], gameOverCallback).setVisible(false).setAlpha(0),
      [GameOverType.STALEMATE]: this.createGameOverMenu('Stalemate', [], gameOverCallback).setVisible(false).setAlpha(0),
    };

    // Define render order
    scene.add.layer([
      this.chessboardOutline,
      this.chessboardTileLayer,
      chessPieceContainer,
      this.pointerTileOutline,
      this.selectedTileOutline,
      this.moveIndicatorLayer,
      this.captureIndicatorLayer,
      this.explosionParticles,
      this.gameOverMenus[GameOverType.WHITE_WIN],
      this.gameOverMenus[GameOverType.BLACK_WIN],
      this.gameOverMenus[GameOverType.DRAW],
      this.gameOverMenus[GameOverType.STALEMATE],
    ]);

  }

  // Creates the chessboard tilemap to be used to position pieces and adds chess square tiles
  createsChessboard(tileSize: number) {
    // Add chessboard
    const chessTileData = [
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0]
    ];
    this.chessboard = this.scene.make.tilemap({ data: chessTileData, tileWidth: tileSize, tileHeight: tileSize });

    // Add chessboard tiles centered at (0, 0) to represent chess squares
    const chessSquareTileset = this.chessboard.addTilesetImage(ASSETS.CHESSBOARD_TILES.key) as Tilemaps.Tileset;
    this.chessboardTileLayer = this.chessboard.createLayer(0, chessSquareTileset, -4 * tileSize, -4 * tileSize) as Tilemaps.TilemapLayer;

    // Add chessboard outline
    const { width, height } = this.chessboardTileLayer;
    const lineWidth = tileSize * .25;
    this.chessboardOutline = this.scene.add.rectangle(0, 0, width + lineWidth, height + lineWidth, 0x252525);
    this.chessboardOutline.postFX.addGlow(0xffffff, .125 * tileSize, 0, false, 1, .375 * tileSize);
  }

  // Creates graphics at each square to indicate valid moves
  createMoveIndicators() {
    // Get coordinates to center the chessboard at (0, 0)
    const { x, y } = this.chessboardTileLayer.getTopLeft();

    // Add graphics to indicate possible captures
    const captureTileset = this.chessboard.addTilesetImage(ASSETS.CHESS_CAPTURE_INDICATOR.key) as Tilemaps.Tileset;
    this.captureIndicatorLayer = (this.chessboard.createBlankLayer('Capture Indicators', captureTileset, x, y) as Tilemaps.TilemapLayer)
      .fill(0, 0, 0, 8, 8);

    // Add graphics to indicate possible moves
    const moveTileset = this.chessboard.addTilesetImage(ASSETS.CHESS_MOVE_INDICATOR.key) as Tilemaps.Tileset;
    this.moveIndicatorLayer = (this.chessboard.createBlankLayer('Move Indicators', moveTileset, x, y) as Tilemaps.TilemapLayer)
      .fill(0, 0, 0, 8, 8);

    // Initially hide move and capture indicators
    this.indicateValidMoves({});
  }

  // Create sprites for all chess pieces on the specified board
  createChessPieces(board: X88Chessboard) {
    this.chessPieces = board.map((piece, index) => {
      if (!piece) return null;
      const { x, y } = this.squareToWorldXY(X88_TO_SQUARE[index]);
      return this.scene.add.existing(new ChessPiece(this.scene, PIECE_TO_TEXTURE_FRAME[piece], x, y));
    });
  }

  // Creates 
  addTileOutline(tileSize: number) {
    return this.scene.add.rectangle(0, 0, tileSize, tileSize).setStrokeStyle(tileSize * .125, 0xffffff, 1)
      .setOrigin(0)
      .setVisible(false);
  }

  // Create a promotion menu displaying options for pawn promotions
  createPromotionMenu(color: Color, square: Square, callback: (piece: PromotablePiece) => any): GameObjects.Container {
    const scene = this.scene;
    const { x, y } = this.squareToWorldXY(square);
    const tileSize = this.chessboard.tileHeight;
    const container = scene.add.container(x, y + (color == Color.BLACK ? -3 * tileSize : 0));
    const background = scene.add.rectangle(0, 0, tileSize, tileSize * 4, 0xffffff, 1)
      .setOrigin(0)
      .setStrokeStyle(2, 0x000000, .5);
    const pieces = PROMOTABLE_PIECES[color];
    if (color == Color.BLACK) {
      pieces.reverse();
    }
    const buttons = pieces.map((piece, i) => scene.add.image(0, i * tileSize, ASSETS.CHESS_PIECES.key, PIECE_TO_TEXTURE_FRAME[piece])
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .once('pointerdown', () => {
        callback(piece);
        container.destroy();
      }));
    return container.add(background)
      .add(buttons);
  }

  // Create a game over menu
  createGameOverMenu(text: string, elems: GameObjects.GameObject[], callback: () => any): GameObjects.Container {
    const scene = this.scene;
    const menu = scene.add.container(0, 0);
    const background = scene.add.graphics()
      .fillStyle(0xfffffff, .5)
      .fillRect(-64, -64, 128, 128);
    const textElem = scene.add.text(0, -32, text, { color: 'black', fontFamily: 'Super Dream', fontSize: 24 })
      .setResolution(48)
      .setStroke('rgba(255, 255, 255, .5)', 2)
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

  // Highlights a square with the specified tile outline
  highlightSquare(outline: GameObjects.Rectangle, square: Square | null) {
    if (!square) {
      outline.visible = false;
      return;
    }
    const { x, y } = this.squareToWorldXY(square);
    outline.setPosition(x, y)
      .setVisible(true);
  }

  // Update graphics to indicate valid moves and captures
  indicateValidMoves({ captures, moves }: { captures?: number[]; moves?: number[]; }) {
    [this.captureIndicatorLayer, this.moveIndicatorLayer].flatMap(layer => layer.getTilesWithin(0, 0, 8, 8))
      .forEach(tile => tile?.setVisible(false));
    captures?.forEach(square => {
      const { x, y } = this.x88ToTileXY(square);
      this.captureIndicatorLayer.getTileAt(x, y)?.setVisible(true);
    });
    moves?.forEach(square => {
      const { x, y } = this.x88ToTileXY(square);
      this.moveIndicatorLayer.getTileAt(x, y)?.setVisible(true);
    })
  }

  // Animates chess piece movement and updates internal position
  movePiece({ from, to }: { from: number; to: number; }) {
    const { x, y } = this.squareToWorldXY(X88_TO_SQUARE[to]);
    this.chessPieces[from]?.move(x, y, this.pieceMoveTime);
    this.chessPieces[to] = this.chessPieces[from];
    this.chessPieces[from] = null;
  }

  // Updates internal position and animates an explosion effect delayed until all pieces have finshed moving
  explodePiece = (square: number) => {
    const sprite = this.chessPieces[square];
    if (!sprite) return;
    this.chessPieces[square] = null; // Remove chess piece from existing chess pieces
    // Add explosion effect after piece movement delay
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

  // Method to update GUI based on a given move
  update({ color, type, captures, explode, from, to }: MoveResult) {
    captures?.forEach(this.explodePiece);
    this.movePiece({ from, to });
    // Moves the rook if the player is castling since only the king's move is given
    if (type == MoveType.KINGSIDE_CASTLE || type == MoveType.QUEENSIDE_CASTLE) {
      this.movePiece(CASTLE_MOVES[color][type].rookMove);
    }
    if (explode) {
      this.explodePiece(to);
    }
  }

  // Animates the game over menu to appear
  showGameOverMenu(gameOverType: GameOverType) {
    this.scene.tweens.add({
      targets: this.gameOverMenus[gameOverType].setVisible(true),
      duration: 1000,
      delay: 1000,
      alpha: { from: 0, to: 1 },
      ease: 'sine.in',
    });
  }

  // Promotes the chess piece at the specified square to the specified piece
  promoteSprite(square: Square, piece: PromotablePiece) {
    this.chessPieces[X88[square]]?.promote(piece);
  }

  // Converts a tile position to the corresponding 0x88 square
  tileXYToX88(x: number, y: number): number {
    return 16 * (7 - y) + x;
  }

  // Converts a 0x88 square to the corresponding tile position
  x88ToTileXY(square: number): Phaser.Types.Math.Vector2Like {
    return { x: getFile(square), y: 7 - getRank(square) };
  }

  // Converts a square to the corresponding world position
  squareToWorldXY(square: Square): Phaser.Math.Vector2 {
    const { x, y } = this.x88ToTileXY(X88[square]);
    return this.chessboardTileLayer.tileToWorldXY(x, y);
  }

  // Converts a world position to the corresponding square
  worldXYToSquare(x: number, y: number): Square | null {
    const { x: tileX, y: tileY } = this.chessboardTileLayer.worldToTileXY(x, y);
    return X88_TO_SQUARE[this.tileXYToX88(tileX, tileY)];
  }

}
