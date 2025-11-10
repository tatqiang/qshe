/**
 * IndexedDB wrapper for offline storage
 */

const DB_NAME = 'qshe_offline'
const DB_VERSION = 2 // Increment version to add new stores

export type StoreName = 'projects' | 'patrols' | 'patrol_photos' | 'corrective_actions' | 'syncQueue'

export interface SyncQueueItem {
  id?: number
  action: 'create' | 'update' | 'delete'
  table: string
  data: any
  timestamp: string
  synced: boolean
  syncedAt?: string
}

class OfflineDB {
  private db: IDBDatabase | null = null

  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' })
          projectStore.createIndex('status', 'status', { unique: false })
          projectStore.createIndex('project_code', 'project_code', { unique: false })
        }

        // Patrols store
        if (!db.objectStoreNames.contains('patrols')) {
          const patrolStore = db.createObjectStore('patrols', { keyPath: 'id' })
          patrolStore.createIndex('patrol_number', 'patrol_number', { unique: false })
          patrolStore.createIndex('status', 'status', { unique: false })
          patrolStore.createIndex('project_id', 'project_id', { unique: false })
          patrolStore.createIndex('patrol_date', 'patrol_date', { unique: false })
        }

        // Patrol photos store
        if (!db.objectStoreNames.contains('patrol_photos')) {
          const photoStore = db.createObjectStore('patrol_photos', { keyPath: 'id' })
          photoStore.createIndex('patrol_id', 'patrol_id', { unique: false })
          photoStore.createIndex('action_id', 'action_id', { unique: false })
        }

        // Corrective actions store
        if (!db.objectStoreNames.contains('corrective_actions')) {
          const actionStore = db.createObjectStore('corrective_actions', { keyPath: 'id' })
          actionStore.createIndex('patrol_id', 'patrol_id', { unique: false })
          actionStore.createIndex('status', 'status', { unique: false })
          actionStore.createIndex('assigned_to', 'assigned_to', { unique: false })
        }

        // Sync queue store (for offline changes)
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
          syncStore.createIndex('synced', 'synced', { unique: false })
        }
      }
    })
  }

  async getAll<T = any>(storeName: StoreName): Promise<T[]> {
    await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async get<T = any>(storeName: StoreName, id: string | number): Promise<T | undefined> {
    await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async add<T = any>(storeName: StoreName, data: T): Promise<IDBValidKey> {
    await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async put<T = any>(storeName: StoreName, data: T): Promise<IDBValidKey> {
    await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName: StoreName, id: string | number): Promise<void> {
    await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(storeName: StoreName): Promise<void> {
    await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.init()
    }
  }

  // Add item to sync queue
  async addToSyncQueue(action: 'create' | 'update' | 'delete', table: string, data: any): Promise<IDBValidKey> {
    return this.add('syncQueue', {
      action,
      table,
      data,
      timestamp: new Date().toISOString(),
      synced: false
    })
  }

  // Get unsynced items
  async getUnsyncedItems(): Promise<SyncQueueItem[]> {
    await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('syncQueue', 'readonly')
      const store = transaction.objectStore('syncQueue')
      const request = store.getAll()

      request.onsuccess = () => {
        // Filter for unsynced items
        const allItems: SyncQueueItem[] = request.result || []
        const unsyncedItems = allItems.filter(item => !item.synced)
        console.log(`📋 Found ${unsyncedItems.length} unsynced items in queue`)
        resolve(unsyncedItems)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Mark item as synced
  async markAsSynced(id: number): Promise<void> {
    await this.ensureDB()
    const item = await this.get('syncQueue', id) as SyncQueueItem | undefined
    if (item) {
      item.synced = true
      item.syncedAt = new Date().toISOString()
      await this.put('syncQueue', item)
    }
  }
}

export const offlineDB = new OfflineDB()
