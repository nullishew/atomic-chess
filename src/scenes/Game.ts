import { Scene, GameObjects } from "phaser";
import { ASSETS, PIECE_TO_TEXTURE_FRAME } from "../assets";
import { chessTileSize } from "../main";
import { Square, Color, PIECE_TO_COLOR, MoveType, GameOverType, PromotablePiece, INITIAL_GAMESTATE, worldXYToSquare, Move, CastleType } from "../atomic-chess/atomicChess";
import { AtomicChessLogic } from "../atomic-chess/AtomicChessLogic";
import { getValidCastlesFrom, getValidDoubleMovesFrom, getValidEnPassantsFrom, getValidStandardCapturesFrom, getValidStandardMovesFrom } from "../atomic-chess/validator";
import { AtomicChessGUI } from "../atomic-chess/AtomicChessGUI";

// Game scene class definition
export class Game extends Scene {
  promotionMenus: Record<Color, GameObjects.Container>;
  gameOverMenus: Record<GameOverType, GameObjects.Container>;

  chessLogic: AtomicChessLogic;
  chessGUI: AtomicChessGUI;

  selectedSquare: Square | null;
  promotionSquare: Square;
  isGameOver: boolean;

  pointerSquare: Square | null;

  get chessboardTilemap() {
    return this.chessGUI.chessboardTilemap;
  }

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

    // Initialize atomic chess gui
    this.chessGUI = new AtomicChessGUI(this, chessTileSize);

    // Initialize atomic chess game
    this.chessLogic = new AtomicChessLogic(INITIAL_GAMESTATE, this);

    

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
      this.chessGUI.pointerSquare(this.pointerSquare);
    });

    // Add pointer input to select squares and make moves
    this.input.on('pointerdown', () => {
      if (this.isGameOver) return;
      const { pointerSquare } = this;
      if (!pointerSquare) {
        this.deselectSquare();
        return;
      }
      const { activeColor, board } = this.chessLogic.data;
      const piece = board[pointerSquare];
      if (piece && PIECE_TO_COLOR[piece] == activeColor) {
        this.selectSquare(pointerSquare);
        return;
      }
      if (!this.selectedSquare) return;
      const square = this.selectedSquare;
      this.deselectSquare();
      this.tryMove({ from: square, to: pointerSquare });
    });
  }

  // Attempt to make a move
  tryMove(move: Move) {
    const { to } = move;
    const { activeColor } = this.chessLogic.data;
    const response = this.chessLogic.tryMove(move);
    console.table(response);
    if (!response) return;
    this.chessGUI.update(response);
    const { moveType } = response;
    if (moveType == MoveType.PROMOTION) {
      this.promotionSquare = to;
      this.promotionMenus[activeColor].visible = true;
    }
    this.tryGameOver();
  }

  // Check for game over condition
  tryGameOver() {
    const gameOverType = this.chessLogic.tryGameOver();
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
    this.chessGUI.selectSquare(square);

    // show valid moves
    this.chessGUI.hideActionIndicators();
    this.chessGUI.indicateCapturableSquares(getValidStandardCapturesFrom(this.chessLogic.data, square))
    this.chessGUI.indicateMovableSquares([
      ...getValidCastlesFrom(this.chessLogic.data, CastleType.KINGSIDE, square),
      ...getValidCastlesFrom(this.chessLogic.data, CastleType.QUEENSIDE, square),
      ...getValidDoubleMovesFrom(this.chessLogic.data, square),
      ...getValidEnPassantsFrom(this.chessLogic.data, square),
      ...getValidStandardMovesFrom(this.chessLogic.data, square)
    ]);
  }

  // Deselect a square
  deselectSquare() {
    this.selectedSquare = null;
    this.chessGUI.deselectSquare();
    this.chessGUI.hideActionIndicators();
  }
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
        game.chessLogic.promote(game.promotionSquare, piece);
        game.chessGUI.promote(game.promotionSquare, piece);
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

