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


    // Initialize atomic chess game
    this.chessLogic = new AtomicChessLogic(structuredClone(INITIAL_GAMESTATE), this);

    // Initialize atomic chess gui
    this.chessGUI = new AtomicChessGUI(this, chessTileSize);

    // Create menus for promoting pawns
    this.promotionMenus = {
      [Color.WHITE]: this.createPromotionMenu(Color.WHITE).setVisible(false),
      [Color.BLACK]: this.createPromotionMenu(Color.BLACK).setVisible(false),
    }

    // Create menus for when the game ends
    this.gameOverMenus = {
      [GameOverType.WHITE_WIN]: this.createGameOverMenu('Winner:', this.add.image(0, 0, ASSETS.CHESS_PIECES.key, 0).setScale(2)).setVisible(false),
      [GameOverType.BLACK_WIN]: this.createGameOverMenu('Winner:', this.add.image(0, 0, ASSETS.CHESS_PIECES.key, 1).setScale(2)).setVisible(false),
      [GameOverType.DRAW]: this.createGameOverMenu('Draw', null).setVisible(false),
      [GameOverType.STALEMATE]: this.createGameOverMenu('Stalemate', null).setVisible(false)
    }

    // Add pointer input to keep track of the square the pointer is currently hovering over
    this.input.on('pointermove', () => {
      const { x, y } = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.pointerSquare = worldXYToSquare(x, y, this.chessboardTilemap);
    });

    // Add pointer input to indicate the square the pointer is currently hovering over
    this.input.on('pointermove', () => {
      if (this.isGameOver) return;
      this.chessGUI.highlightSquare(this.pointerSquare);
    });

    // Add pointer input to select squares and make moves when squares are clicked
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

  createPromotionMenu(color: Color): GameObjects.Container {
    const container = this.add.container(0, 0);
    const background = this.add.graphics()
      .fillStyle(color == Color.WHITE ? 0x000000 : 0xffffff, 1)
      .fillRect(-64, -16, 128, 32);
    const pieceOptions: Record<Color, PromotablePiece[]> = {
      [Color.WHITE]: ['Q', 'B', 'N', 'R'],
      [Color.BLACK]: ['q', 'b', 'n', 'r'],
    };
    const buttons = pieceOptions[color].map(
      (piece, i) => this.add.image((i - 1.5) * 32, 0, ASSETS.CHESS_PIECES.key, PIECE_TO_TEXTURE_FRAME[piece])
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          container.visible = false;
          this.chessLogic.promote(this.promotionSquare, piece);
          this.chessGUI.promoteSprite(this.promotionSquare, piece);
          this.tryGameOver();
        })
    );
    return container.add([background, ...buttons]);
  }

  createGameOverMenu(text: string, image: GameObjects.Image | null): GameObjects.Container {
    const container = this.add.container(0, 0);
    const background = this.add.graphics()
      .fillStyle(0xfffffff, .75)
      .fillRect(-64, -64, 128, 128);
    const textElem = this.add.text(0, -32, text, { color: 'black', fontFamily: 'Super Dream', fontSize: 24 })
      .setResolution(32)
      .setOrigin(.5);
    const button = this.add.image(0, 32, ASSETS.RETRY.key)
      .setScale(1)
      .setOrigin(.5)
      .setInteractive({ useHandCursor: true })
      .once('pointerdown', () => {
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.time.addEvent({
          delay: 1000,
          callback: () => this.scene.restart(),
        });
      });
    return container.add([
      background,
      textElem,
      image,
      button
    ].flatMap(elem => elem ?? []));
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
    menu.setVisible(true)
      .setAlpha(0);
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

    // Show circles and dots to indicate valid moves and captures
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
    this.chessGUI.highlightSquare(null);
    this.chessGUI.hideActionIndicators();
  }
}