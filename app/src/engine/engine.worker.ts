/// <reference lib="webworker" />
import { Chess } from 'chess.js';
import { LEVELS } from '@/engine/levels';
import { clearTranspositionTable, findBestMove, type SearchResult } from '@/engine/search';
import type { EngineRequest, EngineResponse } from '@/engine/protocol';

declare const self: DedicatedWorkerGlobalScope;

const post = (message: EngineResponse) => self.postMessage(message);

self.onmessage = (event: MessageEvent<EngineRequest>) => {
  const request = event.data;

  if (request.type === 'reset') {
    clearTranspositionTable();
    return;
  }

  try {
    // The constructor throws on a malformed FEN.
    const chess = new Chess(request.fen);
    const params = LEVELS[request.difficulty];
    const legal = chess.moves();
    if (legal.length === 0) throw new Error('no legal moves in position');

    let result: SearchResult;
    if (params.blunderRate > 0 && Math.random() < params.blunderRate) {
      // A deliberate slip, so Easy feels beatable rather than merely shallow.
      const started = performance.now();
      result = {
        san: legal[Math.floor(Math.random() * legal.length)],
        score: 0,
        depth: 0,
        nodes: legal.length,
        ms: Math.round(performance.now() - started),
      };
    } else {
      result = findBestMove(chess, params, Math.random);
    }

    // Replay it to hand the UI concrete from/to/promotion values.
    const move = chess.move(result.san);

    post({
      type: 'bestmove',
      id: request.id,
      san: move.san,
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      meta: { depth: result.depth, nodes: result.nodes, ms: result.ms, score: result.score },
    });
  } catch (error) {
    post({
      type: 'error',
      id: request.id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

post({ type: 'ready' });
