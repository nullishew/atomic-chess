import { Scene } from "phaser";
import { AtomicChessGUI } from "../atomic-chess/AtomicChessGUI";
import { AtomicChessLogic } from "../atomic-chess/AtomicChessLogic";
import { Square, INITIAL_GAMESTATE, PIECE_TO_COLOR, PromotablePiece, Move, MoveType, SQUARE_TO_INDEX, gridIndexToSquare } from "../atomic-chess/atomicChess";
import { chessTileSize } from "../main";
import { Flag, legalMovesFrom } from "../atomic-chess/validator";

// Game scene class definition
export class Game extends Scene {
  chessLogic: AtomicChessLogic;
  chessGUI: AtomicChessGUI;

  selectedSquare: Square | null;
  isGameOver: boolean;
  isPromoting: boolean;

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

    // Initialize promotion status
    this.isPromoting = false;

    // Initialize atomic chess game
    this.chessLogic = new AtomicChessLogic(structuredClone(INITIAL_GAMESTATE));

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

    // Add pointer input to keep track of the square the pointer is currently hovering over
    this.input.on('pointermove', () => {
      const { x, y } = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.pointerSquare = worldXYToSquare(x, y, this.chessGUI.chessboardTilemapLayer);
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
      const { activeColor, board } = this.chessLogic.gameState;
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
    const { activeColor } = this.chessLogic.gameState;
    const response = this.chessLogic.tryMove(move);
    if (!response) return;
    this.chessGUI.update(response);
    const { flags } = response;
    console.table(response);
    if (flags.includes(Flag.PROMOTION)) {
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
    const menu = this.chessGUI.gameOverMenus[gameOverType];
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
    const validMoves = legalMovesFrom(this.chessLogic.gameState, square);
    this.chessGUI.indicateValidMoves({
      captures: validMoves.filter(({moveType}) => moveType == MoveType.CAPTURE).map(({to}) => to),
      moves: validMoves.filter(({moveType}) => moveType != MoveType.CAPTURE).map(({to}) => to),
    });
  }

  // Deselect a square
  deselectSquare() {
    this.selectedSquare = null;
    this.chessGUI.deselectSquare();
    this.chessGUI.highlightSquare(null);
    this.chessGUI.indicateValidMoves({captures: [], moves: []});
  }
}

// Converts a square to the corresponding world position based on the given tilemap layer
export function squareToWorldXY(square: Square, tilemapLayer: Phaser.Tilemaps.TilemapLayer): Phaser.Math.Vector2 {
  const [r, c] = SQUARE_TO_INDEX[square];
  return tilemapLayer.tileToWorldXY(c, 7 - r);
}

// Converts a world position based on the given tilemap layer to the corresponding square or null if there is no square at the given position
export function worldXYToSquare(x: number, y: number, tilemapLayer: Phaser.Tilemaps.TilemapLayer): Square | null {
  const { x: c, y: r } = tilemapLayer.worldToTileXY(x, y);
  return gridIndexToSquare([7 - r, c]);
}
