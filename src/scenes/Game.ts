import { Scene } from "phaser";
import { AtomicChessGUI } from "../atomic-chess/AtomicChessGUI";
import { AtomicChess, Square, INITIAL_GAMESTATE, X88, PIECE_TO_COLOR, Flag, PromotablePiece, MoveType } from "../atomic-chess/AtomicChess";
import { chessTileSize } from "../main";

// Game scene class definition
export class Game extends Scene {
  chessLogic: AtomicChess; // Handles move validation and stores the state of the game
  chessGUI: AtomicChessGUI; // Handles graphics and sound effects f the game

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

    // Initialize game state
    this.isGameOver = false;
    this.isPromoting = false;
    this.chessLogic = new AtomicChess(structuredClone(INITIAL_GAMESTATE));

    // Initialize GUI
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

    // Pointer input that updates when the pointer moves
    this.input.on('pointermove', () => {
      // Keeps track of the square the pointer is currently hovering over
      const { x, y } = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.pointerSquare = this.chessGUI.worldXYToSquare(x, y);

      // Highlights the square the pointer is currently hovering over
      if (this.isGameOver || this.isPromoting) return; // Prevent ui updates when promoting a pawn or the game is over
      this.chessGUI.highlightSquare(this.chessGUI.pointerTileOutline, this.pointerSquare);
    });

    // Pointer input that updates when the screen is clicked
    this.input.on('pointerdown', () => {
      if (this.isGameOver || this.isPromoting) return;  // Prevent ui updates when promoting a pawn or the game is over
      const { pointerSquare } = this;
      // Deselect square if a square is not being clicked
      if (!pointerSquare) {
        this.deselectSquare();
        return;
      }
      // Selects a square if it contains a piece of the current player's color
      const { activeColor, board } = this.chessLogic;
      const piece = board[X88[pointerSquare]];
      if (piece && PIECE_TO_COLOR[piece] == activeColor) {
        this.selectSquare(pointerSquare);
        return;
      }
      if (!this.selectedSquare) return;
      // Attempts to make a move if a square of the current color is already selected and the currently selected square is not of the same color
      this.tryMove({ from: this.selectedSquare, to: pointerSquare });
      this.deselectSquare();
    });

    // const space = this?.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    // space?.on('down', () => console.log(this.chessLogic.getFEN()));
  }

  // Attempt to make a move
  tryMove(move: { from: Square, to: Square }) {
    // Validate move
    const { to } = move;
    const { activeColor } = this.chessLogic;
    const result = this.chessLogic.tryMove(move);
    if (!result) return;
    // Update GUI
    this.chessGUI.update(result);
    const { flags } = result;
    console.table(result);
    // When a pawn is promoting, show the promotion menu, update the game state, and update the game when the user selects a piece to promote to
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
    // Checks if the game is over
    this.tryGameOver();
  }

  // Check if the game is already over
  tryGameOver() {
    // Check for conditions to end the game
    const gameOverType = this.chessLogic.tryGameOver();
    if (!gameOverType) return;
    // Update game state and GUI
    this.isGameOver = true;
    this.chessGUI.showGameOverMenu(gameOverType);
  }

  // Select a square
  selectSquare(square: Square) {
    this.selectedSquare = square;

    // Highlight the selected square with an outline
    this.chessGUI.highlightSquare(this.chessGUI.selectedTileOutline, square);

    // Show graphics to indicate valid moves and captures
    const validMoves = this.chessLogic.getLegalMovesFrom(square);
    this.chessGUI.indicateValidMoves({
      captures: validMoves.filter(({ type }) => type == MoveType.CAPTURE).map(({ to }) => to),
      moves: validMoves.filter(({ type }) => type != MoveType.CAPTURE).map(({ to }) => to),
    });
  }

  // Deselect a square
  deselectSquare() {
    this.selectedSquare = null;

    // Update GUI
    this.chessGUI.highlightSquare(this.chessGUI.selectedTileOutline, null);
    this.chessGUI.highlightSquare(this.chessGUI.pointerTileOutline, null);
    this.chessGUI.indicateValidMoves({});
  }
}
