import {
  PScroller,
  PTable,
  PTableBody,
  PTableCell,
  PTableHead,
  PTableHeadCell,
  PTableHeadRow,
  PTableRow,
  PText,
} from '@porsche-design-system/components-react/ssr';
import type { HistoryEntry } from '@/lib/types';
import { toMovePairs } from '@/lib/chess/snapshot';
import { pdsText } from '@/lib/pds';
import styles from '@/styles/panels.module.css';

export function MoveHistory({ history }: { history: readonly HistoryEntry[] }) {
  const pairs = toMovePairs(history);

  if (pairs.length === 0) {
    return (
      <PText size="small" color="contrast-medium">
        No moves yet.
      </PText>
    );
  }

  return (
    <PScroller className={styles.history}>
      <PTable caption="Move history" compact={true}>
        <PTableHead>
          <PTableHeadRow>
            <PTableHeadCell>#</PTableHeadCell>
            <PTableHeadCell>White</PTableHeadCell>
            <PTableHeadCell>Black</PTableHeadCell>
          </PTableHeadRow>
        </PTableHead>
        <PTableBody>
          {pairs.map((pair) => (
            <PTableRow key={pair.moveNumber}>
              <PTableCell>{pdsText(pair.moveNumber)}</PTableCell>
              {/* The last row is half-empty whenever White has moved and Black
                  has not. `pdsText` yields '' rather than null: a bare null
                  child crashes PDS's splitChildren during prerender (#4684). */}
              <PTableCell>{pdsText(pair.white?.san)}</PTableCell>
              <PTableCell>{pdsText(pair.black?.san)}</PTableCell>
            </PTableRow>
          ))}
        </PTableBody>
      </PTable>
    </PScroller>
  );
}
