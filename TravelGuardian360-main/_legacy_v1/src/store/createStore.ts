/**
 * Minimal Zustand-compatible store factory.
 *
 * Implements the exact `create((set, get) => ...)` API and a `useStore(selector)`
 * hook backed by React's useSyncExternalStore. This is an in-house stand-in for
 * the `zustand` package (blocked by the network proxy). When zustand is
 * installed, replace the import in each store file with:
 *     import { create } from 'zustand';
 * and delete this file — the store definitions need no other changes.
 */
import { useSyncExternalStore } from 'react';

type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
type GetState<T> = () => T;
type StateCreator<T> = (set: SetState<T>, get: GetState<T>) => T;

export type UseBoundStore<T> = {
  <U>(selector: (state: T) => U): U;
  (): T;
  getState: GetState<T>;
  setState: SetState<T>;
  subscribe: (listener: () => void) => () => void;
};

export function create<T extends object>(creator: StateCreator<T>): UseBoundStore<T> {
  let state: T;
  const listeners = new Set<() => void>();

  const setState: SetState<T> = (partial) => {
    const next = typeof partial === 'function' ? (partial as (s: T) => Partial<T>)(state) : partial;
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  };

  const getState: GetState<T> = () => state;

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = creator(setState, getState);

  const useStore = (<U>(selector?: (s: T) => U) =>
    useSyncExternalStore(
      subscribe,
      () => (selector ? selector(state) : (state as unknown as U)),
    )) as UseBoundStore<T>;

  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;
  return useStore;
}
