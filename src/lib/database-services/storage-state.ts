export type StorageType = 'indexeddb' | 'localstorage' | 'none';

let storageType: StorageType | null = null;

export function setStorageType(type: StorageType | null): void {
  storageType = type;
}

export function getStorageType(): StorageType | null {
  return storageType;
}

export function getRequiredStorageType(): StorageType {
  if (storageType === null) {
    throw new Error('Database not initialized. Call DatabaseService.initialize() first.');
  }

  return storageType;
}
