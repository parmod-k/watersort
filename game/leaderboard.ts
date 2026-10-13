import { BoardEntry, BoardKind, buildBoard } from './scoring';

/** What the Rank tab needs from one board. */
export type BoardView = {
  /** Highest-ranked rows. */
  top: BoardEntry[];
  /** The player's row with their neighbours just above and below. */
  around: BoardEntry[];
  me: BoardEntry;
  total: number;
};

type Me = Omit<BoardEntry, 'rank'>;

/** The player against the built-in sample rivals. */
export function useBoardView(me: Me, kind: BoardKind): BoardView {
  const board = buildBoard(me, kind);
  const i = board.findIndex((e) => e.isMe);
  return { top: board.slice(0, 5), around: board.slice(Math.max(0, i - 1), i + 2), me: board[i], total: board.length };
}
