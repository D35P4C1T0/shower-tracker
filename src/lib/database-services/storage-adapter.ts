import { getRequiredStorageType } from './storage-state';

interface StorageOperation<T> {
  indexedDB: () => Promise<T>;
  localStorage: () => Promise<T>;
  noStorage: () => T | Promise<T>;
  fallbackMessage?: string;
}

export async function runStorageOperation<T>({
  indexedDB,
  localStorage,
  noStorage,
  fallbackMessage = 'IndexedDB failed, trying localStorage fallback:',
}: StorageOperation<T>): Promise<T> {
  const storageType = getRequiredStorageType();

  if (storageType === 'localstorage') {
    return await localStorage();
  }

  if (storageType === 'none') {
    return await noStorage();
  }

  try {
    return await indexedDB();
  } catch (error) {
    console.warn(fallbackMessage, error);
    return await localStorage();
  }
}
