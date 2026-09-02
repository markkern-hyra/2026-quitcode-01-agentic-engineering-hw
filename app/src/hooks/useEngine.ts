'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BestMove, Difficulty, EngineRequest, EngineResponse } from '@/engine/protocol';
import { MIN_THINK_MS } from '@/engine/levels';

export function useEngine(onBestMove: (move: BestMove) => void) {
  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const startedAt = useRef(0);
  const [thinking, setThinking] = useState(false);

  // Kept in a ref so the worker effect can stay dependency-free and the worker
  // is created exactly once.
  const callback = useRef(onBestMove);
  useEffect(() => {
    callback.current = onBestMove;
  }, [onBestMove]);

  useEffect(() => {
    // The `new URL(...)` argument has to be this literal expression: both
    // Turbopack and webpack discover the worker by static analysis, and a
    // variable here resolves to a silent 404 at runtime.
    const worker = new Worker(new URL('../engine/engine.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<EngineResponse>) => {
      const message = event.data;
      if (message.type === 'ready') return;
      // Stale reply: the player took the move back or started a new game while
      // this search was running. The worker cannot be interrupted mid-search,
      // so dropping the answer here is the cancellation mechanism.
      if (message.id !== requestId.current) return;

      const finish = () => {
        setThinking(false);
        if (message.type === 'bestmove') callback.current(message);
      };

      // An instant reply reads as a bug rather than as strength.
      const elapsed = performance.now() - startedAt.current;
      if (elapsed >= MIN_THINK_MS) finish();
      else setTimeout(finish, MIN_THINK_MS - elapsed);
    };

    return () => {
      // StrictMode double-mounts in development; without this there are two
      // engines racing each other.
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const requestMove = useCallback((fen: string, difficulty: Difficulty) => {
    const id = ++requestId.current;
    startedAt.current = performance.now();
    setThinking(true);
    workerRef.current?.postMessage({
      type: 'search',
      id,
      fen,
      difficulty,
    } satisfies EngineRequest);
  }, []);

  const abort = useCallback(() => {
    requestId.current++;
    setThinking(false);
  }, []);

  const reset = useCallback(() => {
    requestId.current++;
    setThinking(false);
    workerRef.current?.postMessage({ type: 'reset' } satisfies EngineRequest);
  }, []);

  return { thinking, requestMove, abort, reset };
}
