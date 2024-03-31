// class ChessGrid<T> {
//   #state: (T | null)[][];

//   constructor(state: (T | null)[][]) {
//     this.#state = state;
//   }

//   get state() { return this.#state.map(row => row.slice()) }

//   at([r, c]: Pos): T | null {
//     return this.#state?.[r]?.[c];
//   }

//   emptyAt(pos: Pos) {
//     return this.has(pos) && !this.at(pos);
//   }

//   has([r, c]: Pos) {
//     return 0 <= r && r < 8 && 0 <= c && c < 8;
//   }

//   isAdjacent(p1: Pos, p2: Pos) {
//     if (!this.has(p1) || !this.has(p2)) return false;
//     const [r1, c1] = p1;
//     const [r2, c2] = p2;
//     return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
//   }


//   setAt([r, c]: Pos, val: T | null) {
//     this.#state[r][c] = val;
//   }

//   // capture(from: Pos, to: Pos) {
//   //   this.explode(to);
//   //   this.explode(from);
//   //   this.explodeArea(to);
//   // }

//   // castleKingside(color: ChessColor) {
//   //   const r = [7, 0][color];
//   //   this.move([r, 4], [r, 6]);
//   //   this.move([r, 7], [r, 5]);
//   // }

//   // castleQueenside(color: ChessColor) {
//   //   const r = [7, 0][color];
//   //   this.move([r, 4], [r, 2]);
//   //   this.move([r, 0], [r, 3]);
//   // }

//   // enPassant(from: Pos, to: Pos) {
//   //   const r1 = from[0];
//   //   const c2 = to[1];
//   //   this.explode([r1, c2]);
//   //   this.explode(from);
//   //   this.explodeArea(to);
//   // }

//   // move(from: Pos, to: Pos) {
//   //   this.setAt(to, this.at(from));
//   //   this.setAt(from, null);
//   // }

//   // explode(pos: Pos) {
//   //   this.setAt(pos, null);
//   // }

//   // // explodeArea([r, c]: Pos) {
//   // //   for (let dr = -1; dr <= 1; dr++) {
//   // //     for (let dc = -1; dc <= 1; dc++) {
//   // //       const pos: Pos = [r + dr, c + dc];
//   // //       if (!this.has(pos) || this.emptyAt(pos) || this.typeAt(pos) == PiecesEnum.PAWN) continue;
//   // //       this.explode(pos);
//   // //     }
//   // //   }
//   // // }

// }