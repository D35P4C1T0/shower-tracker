import { getRequiredStorageType } from './storage-state';

interface StorageOperation<T> {
  indexedDB: () => Promise<T>;
  localStorage: () => Promise<T>;
  noStorage: () => T | Promise<T>;
}

export async function runStorageOperation<T>({
  indexedDB,
  localStorage,
  noStorage,
}: StorageOperation<T>): Promise<T> {
  const storageType = getRequiredStorageType();

  if (storageType === 'localstorage') {
    return await localStorage();
  }

  if (storageType === 'none') {
    return await noStorage();
  }

  return await indexedDB();
}
