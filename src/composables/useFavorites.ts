import { computed, shallowRef } from 'vue'
import { createFavoriteRepository } from '../repositories/favorites'
import { catalog } from '../repositories/catalog'
const repository = createFavoriteRepository(() => window.localStorage)
const state = shallowRef(repository.read())
repository.subscribe((value) => {
  state.value = value
})
export function useFavorites() {
  return {
    saved: computed(() => state.value.items),
    persistent: computed(() => state.value.persistent),
    count: computed(
      () => catalog.list().filter((s) => state.value.items[s.id] !== undefined).length,
    ),
    has: (id: string) => state.value.items[id] !== undefined,
    set: (id: string, time: number | null) => repository.set(id, time),
  }
}
