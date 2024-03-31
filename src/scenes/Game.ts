import { GameObjects, Scene, Sound, Tilemaps } from 'phaser';
import { ASSETS } from '../assets';
import { AtomicChess, CastlingData } from '../chess/AtomicChess';
import { ChessSpritePosition } from '../chess/ChessSpritePosition';
import { ChessPosition } from '../chess/ChessPosition';
import { chessTileSize } from '../main';

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;

  chessboardMap: Tilemaps.Tilemap;

  selectedTile: Tilemaps.Tile | null;

  pointerTileMarker: GameObjects.Graphics;
  selectedTileMarker: GameObjects.Graphics;
  moveMarkers: GameObjects.Graphics[][];

  chess: AtomicChess;

  fromTile: Pos | null;

  debugText: GameObjects.Text;
  explosionSound: Sound.NoAudioSound | Sound.HTML5AudioSound | Sound.WebAudioSound;
  explosionParticles: GameObjects.Particles.ParticleEmitter;

  promotionPos: Pos;
  promotionMenus: Tuple2<GameObjects.Container>;
  gameOverMenus: { draw: GameObjects.Container, stalemate: GameObjects.Container, win: Tuple2<GameObjects.Container> };

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
    this.cameras.main.fadeIn(3000, 0, 0, 0);
    this.isGameOver = false;

    const cam = this.cameras.main;
    const { centerX, centerY } = cam;
    cam.setScroll(-centerX, -centerY);


    this.explosionSound = this.sound.add(ASSETS.EXPLOSION.key);

    this.chessboardMap = createChessboard(this, chessTileSize);

    // const { x, y } = this.chessboardMap.tileToWorldXY(-.5, -.5) as Phaser.Math.Vector2;
    // const chessTileGroup = this.add.group({
    //   key: ASSETS.PARTICLE.key,
    //   quantity: 8 * 8,
    //   gridAlign: {
    //     width: 8,
    //     height: 8,
    //     cellWidth: chessTileSize,
    //     cellHeight: chessTileSize,
    //     x: x,
    //     y: y,
    //   },
    //   setOrigin: { x: 0.5, y: 0.5 },
    //   setScale: { x: 0, y: 0 }
    // });
    // chessTileGroup.getChildren().forEach((tile, i) => {
    //   const color = [0x111111, 0xeeeeee][(Math.floor(i / 8) + i % 8) % 2];
    //   (tile as GameObjects.Image).setTintFill(color);
    // })
    // this.tweens.add({
    //   targets: chessTileGroup.getChildren(),
    //   scale: .5,
    //   ease: 'linear',
    //   duration: 300,
    //   delay: this.tweens.stagger(30, { grid: [8, 8], from: 'first' }),
    //   // completeDelay: 1000,
    //   onComplete: () => {
    //     chessTileGroup.getChildren().forEach(child => {
    //       (child as GameObjects.Image).setScale(.5);
    //     });
    //     finishSetup();
    //   }
    // });


    const chessboardSetup: ChessPositionArrayNotation = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
    ];

    this.chess = new AtomicChess(
      {
        position: new ChessPosition(chessboardSetup),
        activeColor: 0 as ChessColor,
        canCastle: [{ kingside: true, queenside: true }, { kingside: true, queenside: true }] as CastlingData,
        enPassants: [],
        halfMoves: 0,
        fullMoves: 0,
      },
      new ChessSpritePosition(this, chessboardSetup)
    );

    this.pointerTileMarker = createTileMarker(this, chessTileSize, chessTileSize * .1, 0xffffff, 1);
    this.selectedTileMarker = createTileMarker(this, chessTileSize, chessTileSize * .1, 0xffffff, 1);

    this.moveMarkers = chessboardSetup.map((row, r) => row.map(
      (_, c) => createMoveMarker(this, this.chessboardMap, r, c, .1 * chessTileSize)
    ));

    // Create menus for promoting pawns
    this.promotionMenus = [
      createPromotionMenu(this, 0).setVisible(false),
      createPromotionMenu(this, 1).setVisible(false),
    ];

    this.gameOverMenus = {
      stalemate: createGameOverMenu(this, 'Stalemate', null).setVisible(false),
      draw: createGameOverMenu(this, 'Draw', null).setVisible(false),
      win: [
        createGameOverMenu(this, 'Winner:', this.add.image(0, 0, ASSETS.CHESS_PIECES.key, 0).setScale(2)).setVisible(false),
        createGameOverMenu(this, 'Winner:', this.add.image(0, 0, ASSETS.CHESS_PIECES.key, 1).setScale(2)).setVisible(false),
      ],
    };




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
    this.input.on('pointerdown', () => {
      if (this.isGameOver) return;
      const deselectTile = () => {
        this.hideMoveMarkers();
        this.selectedTileMarker.visible = false;
        this.selectedTile = null;
        this.fromTile = null;
      }
      const selectTile = (pos: Pos) => {
        this.fromTile = pos;
        const [r, c] = pos;
        const { x, y } = this.chessboardMap.tileToWorldXY(c, r) as Phaser.Math.Vector2;
        this.selectedTileMarker.setPosition(x, y);
        this.selectedTileMarker.visible = true;
        this.showValidMoves(pos);
      }
      const tile = this.pointerTile;
      if (!tile) {
        deselectTile();
        return;
      }
      const { x, y } = tile;
      const pos: Pos = [y, x];
      const { activeColor, position } = this.chess.data;
      if (position.colorAt(pos) == activeColor) {
        selectTile(pos);
        return;
      }
      const from = this.fromTile;
      if (!from) return;
      deselectTile();
      if (!this.tryMove(from, pos)) return;
      this.isGameOver = this.tryGameOver(activeColor);
    });
  }


  update() {
    this.pointToTileAtPointer();
  }

  pointToTileAtPointer() {
    if (!this.pointerTileMarker) return;
    const tile = this.pointerTile;
    if (!tile) {
      this.pointerTileMarker.visible = false;
      return;
    }
    const { x, y } = this.chessboardMap.tileToWorldXY(tile.x, tile.y) as Phaser.Math.Vector2;
    this.pointerTileMarker.visible = true;
    this.pointerTileMarker.setPosition(x, y);
  }

  showValidMoves(pos: Pos) {
    this.hideMoveMarkers();
    this.chess.validator.validMovesFrom(pos)
      .forEach(([r, c]) => {
        const marker = this.moveMarkers[r][c];
        this.children.bringToTop(marker);
        marker.visible = true;
      });
  }

  hideMoveMarkers() {
    this.moveMarkers.flat().forEach(marker => marker.visible = false);
  }

  tryMove(from: Pos, to: Pos): boolean {
    const { validator, data } = this.chess;
    const { activeColor, position } = data;
    console.log('in check? ' + validator.isAtomicCheck(activeColor, position));
    console.log(`checkmate? ${validator.isCheckMate(activeColor)}`);
    console.log(`pawn promotion? ${validator.isPawnPromotion(from, to)}`);

    const isPromotion = validator.isPawnPromotion(from, to);
    if (validator.isValidStandardMove(from, to)) {
      const color = activeColor;
      this.chess.moveStandard(from, to);
      if (isPromotion) {
        this.promotionPos = to;
        this.promotionMenus[color].visible = true;
      }
      return true;
    }
    if (validator.isValidCapture(from, to)) {
      this.chess.capture(from, to);
      return true;
    }
    if (validator.isValidDoubleMove(from, to)) {
      this.chess.moveDouble(from, to);
      return true;
    }
    if (validator.isValidEnPassant(from, to)) {
      this.chess.enPassant(from, to);
      return true;
    }
    if (validator.isValidCastleKingside(from, to)) {
      this.chess.castleKingside(activeColor);
      return true;
    }
    if (validator.isValidCastleQueenside(from, to)) {
      this.chess.castleQueenside(activeColor);
      return true;
    }
    return false;
  }

  tryGameOver(color: ChessColor): boolean {
    const { win, draw, stalemate } = this.gameOverMenus;
    const showMenu = (menu: GameObjects.Container) => {
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
    if (this.chess.isWin(color)) {
      console.log(`${color} won!`);
      showMenu(win[color]);
      return true;
    }
    if (this.chess.isDraw()) {
      console.log(`Draw`);
      showMenu(draw);
      return true;
    }
    if (this.chess.isStalemate()) {
      console.log('Stalemate');
      showMenu(stalemate);
      return true;
    }
    return false;
  }

}

function createChessboard(scene: Scene, tileSize: number) {
  // const data = [
  //   [0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0],
  //   [0, 0, 0, 0, 0, 0, 0, 0],
  // ];
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
  // const tileset = map.addTilesetImage(ASSETS.BLANK_TILE.key) as Tilemaps.Tileset;
  const layer = map.createLayer(0, tileset, 0, 0) as Tilemaps.TilemapLayer;
  const { x, y } = layer.getBottomRight() as Phaser.Math.Vector2;
  layer.setPosition(-.5 * x, -.5 * y);
  return map;
}

function createTileMarker(scene: Scene, tileSize: number, lineWidth: number, color: number, alpha: number) {
  const marker = scene.add.graphics();
  marker.lineStyle(lineWidth, color, alpha);
  marker.strokeRect(0, 0, tileSize, tileSize);
  marker.visible = false;
  return marker;
}

function createMoveMarker(scene: Scene, tilemap: Tilemaps.Tilemap, r: number, c: number, size: number) {
  const { x, y } = tilemap.tileToWorldXY(c + .5, r + .5) as Phaser.Math.Vector2;
  const graphics = scene.add.graphics()
    .fillStyle(0x808080, .5)
    .fillCircle(x, y, size)
    .setActive(false)
    .setVisible(false);
  return graphics;
}

function createPromotionMenu(game: Game, color: ChessColor) {
  const data: PromotablePieceNotation[][] = [
    ['Q', 'B', 'N', 'R'],
    ['q', 'b', 'n', 'r'],
  ];
  const container = game.add.container(0, 0);
  return container.add([
    game.add.graphics()
      .fillStyle(color == 0 ? 0x000000 : 0xffffff, 1)
      .fillRect(-64, -16, 128, 32),
    ...data[color].map((piece, i) => game.add.image((i - 1.5) * 32, 0, ASSETS.CHESS_PIECES.key, 2 + i * 2 + color)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        game.chess.promote(game.promotionPos, piece);
        container.visible = false;
      }))
  ]);
}

function createGameOverMenu(game: Scene, text: string, image: GameObjects.Image | null) {
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