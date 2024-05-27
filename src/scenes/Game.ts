import { Scene } from "phaser";
import { AtomicChessGUI } from "../atomic-chess/AtomicChessGUI";
import { AtomicChess, Square, INITIAL_GAMESTATE, X88, PIECE_TO_COLOR, Flag, PromotablePiece, MoveType } from "../atomic-chess/AtomicChess";
import { chessTileSize } from "../main";

// Game scene class definition
export class Game extends Scene {
  chessLogic: AtomicChess;
  chessGUI: AtomicChessGUI;

  selectedSquare: Square | null;
  pointerSquare: Square | null;

  isGameOver: boolean;
  isPromoting: boolean;

  constructor() {
    super('Game'); // Call to superclass constructor with scene key
  }

  // Scene creation method
  create() {
    // Fade in camera
    this.cameras.main.fadeIn(3000, 0, 0, 0);

    // Initialize game over status
    this.isGameOver = false;

    // Initialize promotion status
    this.isPromoting = false;

    // Initialize atomic chess game
    this.chessLogic = new AtomicChess(structuredClone(INITIAL_GAMESTATE));

    // Initialize atomic chess gui
    this.chessGUI = new AtomicChessGUI({
      scene: this,
      tileSize: chessTileSize,
      pieceMoveTime: 100,
      gameOverMenuCallback: () => {
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.time.addEvent({
          delay: 1000,
          callback: () => this.scene.restart(),
        });
      }
    });
    this.chessGUI.indicateValidMoves({ captures: [], moves: [] });

    // Add pointer input to keep track of the square the pointer is currently hovering over
    this.input.on('pointermove', () => {
      const { x, y } = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.pointerSquare = this.chessGUI.worldXYToSquare(x, y);
    });

    // Add pointer input to indicate the square the pointer is currently hovering over
    this.input.on('pointermove', () => {
      if (this.isGameOver || this.isPromoting) return;
      this.chessGUI.highlightSquare(this.pointerSquare);
    });

    // Add pointer input to select squares and make moves when squares are clicked
    this.input.on('pointerdown', () => {
      if (this.isGameOver || this.isPromoting) return;
      const { pointerSquare } = this;
      if (!pointerSquare) {
        this.deselectSquare();
        return;
      }
      const { activeColor, board } = this.chessLogic;
      const piece = board[X88[pointerSquare]];
      if (piece && PIECE_TO_COLOR[piece] == activeColor) {
        this.selectSquare(pointerSquare);
        return;
      }
      if (!this.selectedSquare) return;
      const square = this.selectedSquare;
      this.deselectSquare();
      this.tryMove({ from: square, to: pointerSquare });
    });

    const space = this?.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    space?.on('down', () => console.log(this.chessLogic.getFEN()));
  }

  // Attempt to make a move
  tryMove(move: { from: Square, to: Square }) {
    const { to } = move;
    const { activeColor } = this.chessLogic;
    const response = this.chessLogic.tryMove(move);
    if (!response) return;
    this.chessGUI.update(response);
    const { flags } = response;
    console.table(response);
    if (flags?.[Flag.PROMOTION]) {
      this.isPromoting = true;
      this.chessGUI.createPromotionMenu(activeColor, to, (piece: PromotablePiece) => {
        this.chessLogic.promote(to, piece);
        this.chessGUI.promoteSprite(to, piece);
        this.isPromoting = false;
        this.tryGameOver();
      });
      return; // prevent attempting to end the game before player has promoted the pawn
    }
    this.tryGameOver();
  }

  // Check for game over condition
  tryGameOver() {
    const gameOverType = this.chessLogic.tryGameOver();
    if (!gameOverType) return;
    this.isGameOver = true;
    this.chessGUI.showGameOverMenu(gameOverType);
  }

  // Select a square
  selectSquare(square: Square) {
    this.selectedSquare = square;
    this.chessGUI.selectSquare(square);

    // Show circles and dots to indicate valid moves and captures
    const validMoves = this.chessLogic.getLegalMovesFrom(square);
    console.log(validMoves);
    this.chessGUI.indicateValidMoves({
      captures: validMoves.filter(({ type: moveType }) => moveType == MoveType.CAPTURE).map(({ to }) => to),
      moves: validMoves.filter(({ type: moveType }) => moveType != MoveType.CAPTURE).map(({ to }) => to),
    });
  }

  // Deselect a square
  deselectSquare() {
    this.selectedSquare = null;
    this.chessGUI.deselectSquare();
    this.chessGUI.highlightSquare(null);
    this.chessGUI.indicateValidMoves({ captures: [], moves: [] });
  }
}
