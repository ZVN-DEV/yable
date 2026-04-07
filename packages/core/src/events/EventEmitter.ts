// @zvndev/yable-core — Typed Event Emitter

export class EventEmitterImpl<TEventMap extends Record<string, any>> {
  private listeners = new Map<keyof TEventMap, Set<(payload: any) => void>>()

  on<K extends keyof TEventMap>(
    event: K,
    handler: (payload: TEventMap[K]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)

    // Return unsubscribe function
    return () => this.off(event, handler)
  }

  off<K extends keyof TEventMap>(
    event: K,
    handler: (payload: TEventMap[K]) => void
  ): void {
    this.listeners.get(event)?.delete(handler)
  }

  emit<K extends keyof TEventMap>(event: K, payload: TEventMap[K]): void {
    const handlers = this.listeners.get(event)
    if (!handlers) return
    for (const handler of handlers) {
      handler(payload)
    }
  }

  removeAllListeners(event?: keyof TEventMap): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}
