import { useEffect, useState } from 'react';
import { BoardEntry, BoardKind, buildBoard } from './scoring';
import { fetchLeaderboard } from './sync';

/** What the Rank tab needs from one board, whether it came from the server or the offline sample. */
export type BoardView = {
  /** Highest-ranked rows. */
  top: BoardEntry[];
  /** The player's row with their neighbours just above and below. */
  around: BoardEntry[];
  me: BoardEntry;
  total: number;
  online: boolean;
};

type Me = Omit<BoardEntry, 'rank'>;

/** Offline board: the player against the built-in sample rivals. */
function localView(me: Me, kind: BoardKind): BoardView {
  const board = buildBoard(me, kind);
  const i = board.findIndex((e) => e.isMe);
  return { top: board.slice(0, 5), around: board.slice(Math.max(0, i - 1), i + 2), me: board[i], total: board.length, online: false };
}

/** The online board for `kind`, showing the offline one until it loads or if the server is unreachable. */
export function useBoardView(me: Me, kind: BoardKind): BoardView {
  const [server, setServer] = useState<{ kind: BoardKind; view: BoardView } | null>(null);
  const local = localView(me, kind);

  useEffect(() => {
    let live = true;
    fetchLeaderboard(kind)
      .then((b) => {
        // Name the player's own rows with the local name in case a rename hasn't synced yet.
        const mine = (e: BoardEntry) => (e.isMe ? { ...e, name: me.name } : e);
        if (live) setServer({ kind, view: { top: b.top.map(mine), around: b.around.map(mine), me: mine(b.me), total: b.total, online: true } });
      })
      .catch(() => live && setServer(null));
    return () => {
      live = false;
    };
  }, [kind, me.name, me.level, me.stars, me.score]);

  return server?.kind === kind ? server.view : local;
}
