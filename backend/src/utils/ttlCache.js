// A small in-memory cache with an expiry per entry and a size cap. Enough for this app: the
// backend runs as a single process (ecosystem.config.cjs, instances: 1), so one Map is shared
// by every request. If it ever runs as several processes, each keeps its own copy; entries
// still expire on their TTL, but clearing one process's copy no longer clears the others —
// that is the point to move to a shared cache such as Redis.
export function createTtlCache({ ttlMs, maxEntries = 1000 }) {
  const map = new Map() // key -> { value, expires }

  return {
    get(key) {
      const hit = map.get(key)
      if (!hit) return undefined
      if (hit.expires <= Date.now()) {
        map.delete(key)
        return undefined
      }
      return hit.value
    },
    set(key, value) {
      // Map keeps insertion order, so the first key is the oldest: drop it when full.
      if (map.size >= maxEntries && !map.has(key)) map.delete(map.keys().next().value)
      map.set(key, { value, expires: Date.now() + ttlMs })
    },
    delete(key) {
      map.delete(key)
    },
    clear() {
      map.clear()
    },
  }
}
