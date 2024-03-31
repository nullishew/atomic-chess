type Pos = [number, number];

type ChessColor = 0 | 1;
type PieceNotation = 'K' | 'Q' | 'B' | 'N' | 'R' | 'P' | 'k' | 'q' | 'b' | 'n' | 'r' | 'p';
type PromotablePieceNotation = 'Q' | 'q' | 'B' | 'b' | 'N' | 'n' | 'R' | 'r';
type Tuple8<T> = [T, T, T, T, T, T, T, T];
type Tuple2<T> = [T, T];
type ChessPositionRowNotation = Tuple8<PieceNotation | null>;
type ChessPositionArrayNotation = Tuple8<ChessPositionRowNotation>;