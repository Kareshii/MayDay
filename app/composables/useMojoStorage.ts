import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'mayday-mojo-db'
const STORE_NAME = 'owned-items'

export const useMojoStorage = () => {
  const ownedItems = ref<Set<string>>(new Set())
  const isReady = ref(false)
  let db: IDBPDatabase | null = null

  const initDB = async () => {
    if (import.meta.server) return

    db = await openDB(DB_NAME, 1, {
      upgrade(db: IDBPDatabase) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })

    await refreshOwnedItems()
    isReady.value = true
  }

  const refreshOwnedItems = async () => {
    if (!db) return
    const allItems = await db.getAll(STORE_NAME)
    ownedItems.value = new Set(allItems.map((item: any) => item.id))
  }

  const toggleOwnership = async (id: string) => {
    if (!db) return

    if (ownedItems.value.has(id)) {
      await db.delete(STORE_NAME, id)
    } else {
      await db.put(STORE_NAME, { id, timestamp: Date.now() })
    }
    await refreshOwnedItems()
  }

  const isOwned = (id: string) => ownedItems.value.has(id)

  onMounted(() => {
    initDB()
  })

  return {
    ownedItems,
    isReady,
    toggleOwnership,
    isOwned
  }
}
