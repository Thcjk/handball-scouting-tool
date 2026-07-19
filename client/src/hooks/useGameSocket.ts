import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, BattleResult } from '../api/client';
import { isOfflineMode } from '../api/client';

const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin;

interface UseGameSocketOptions {
  onGameStateUpdate?: (state: GameState) => void;
  onBattleResult?: (data: { result: BattleResult; successionResult?: unknown }) => void;
  onResourceTick?: (data: { resources: GameState['kingdom']['resources'] }) => void;
  onSuccession?: (data: unknown) => void;
  onDiplomacyEvent?: (data: unknown) => void;
}

export function useGameSocket(options: UseGameSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || socketRef.current?.connected) return;

    const socket = io(`${WS_URL}/game`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('gameStateUpdate', (state: GameState) => {
      optionsRef.current.onGameStateUpdate?.(state);
    });

    socket.on('battleResult', (data) => {
      optionsRef.current.onBattleResult?.(data);
    });

    socket.on('resourceTick', (data) => {
      optionsRef.current.onResourceTick?.(data);
    });

    socket.on('succession', (data) => {
      optionsRef.current.onSuccession?.(data);
    });

    socket.on('diplomacyEvent', (data) => {
      optionsRef.current.onDiplomacyEvent?.(data);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  useEffect(() => {
    if (isOfflineMode) return;
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connect, disconnect };
}
