/**
 * Local IndexedDB Storage for Customer Virtual Try-On Looks.
 * 
 * STRICT PRIVACY GUARANTEE:
 * All photos, uploads, and AI try-on generations are saved EXCLUSIVELY
 * on the customer's local device storage (IndexedDB).
 * NOTHING is sent or uploaded to Firebase Firestore or Firebase Storage.
 */

export interface TryOnLook {
  id: string;
  productId: string;
  productName: string;
  garmentType: 'upper' | 'lower';
  imageUri: string; // Base64 data URI of the generated try-on
  createdAt: string;
}

const DB_NAME = 'kinora_tryon_db';
const STORE_NAME = 'saved_looks';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Saves a generated try-on look to the customer's local device.
 */
export const saveLocalTryOnLook = async (
  look: Omit<TryOnLook, 'id' | 'createdAt'>
): Promise<TryOnLook> => {
  const newLook: TryOnLook = {
    ...look,
    id: `tryon_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(newLook);
      req.onsuccess = () => resolve(newLook);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error saving try-on look to IndexedDB:', err);
    // Fallback to localStorage for small items if IndexedDB fails
    try {
      const existing = JSON.parse(localStorage.getItem('kinora_tryon_history') || '[]');
      existing.unshift(newLook);
      // Keep max 10 in localStorage fallback
      localStorage.setItem('kinora_tryon_history', JSON.stringify(existing.slice(0, 10)));
      return newLook;
    } catch {
      return newLook;
    }
  }
};

/**
 * Retrieves all saved try-on looks from local device storage.
 */
export const getLocalTryOnLooks = async (): Promise<TryOnLook[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const looks: TryOnLook[] = req.result || [];
        looks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(looks);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error fetching try-on looks from IndexedDB, using fallback:', err);
    try {
      const local = JSON.parse(localStorage.getItem('kinora_tryon_history') || '[]');
      return local;
    } catch {
      return [];
    }
  }
};

/**
 * Deletes a saved try-on look from local device storage.
 */
export const deleteLocalTryOnLook = async (id: string): Promise<boolean> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error deleting try-on look from IndexedDB:', err);
    try {
      const local = JSON.parse(localStorage.getItem('kinora_tryon_history') || '[]');
      const filtered = local.filter((item: TryOnLook) => item.id !== id);
      localStorage.setItem('kinora_tryon_history', JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }
};
