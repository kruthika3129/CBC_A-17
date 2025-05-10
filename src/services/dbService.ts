// PsyTrack Database Service
// This service handles local data persistence using IndexedDB

import { EmotionState, TimeCapsuleEntry, EmotionCategory } from '@/lib/aiCore';

// Database schema
export interface DBSchema {
  emotionStates: EmotionState[];
  timeCapsuleEntries: TimeCapsuleEntry[];
  journalEntries: JournalEntry[];
  userSettings: UserSettings;
}

// Journal entry schema
export interface JournalEntry {
  id?: number;
  text: string;
  sentiment?: string;
  detectedEmotion?: EmotionCategory;
  confidence?: number;
  timestamp: number;
}

// User settings schema
export interface UserSettings {
  id?: number;
  storeRawData: boolean;
  shareWithTherapist: boolean;
  shareWithCaregivers: boolean;
  dataRetentionDays: number;
  anonymizeData: boolean;
  allowRemoteProcessing: boolean;
  theme: 'light' | 'dark' | 'system';
  lastSync?: number;
}

// Database event callbacks
type DBReadyCallback = () => void;
type DBErrorCallback = (error: Error) => void;
type DataChangeCallback = (storeName: string) => void;

class DBService {
  private static instance: DBService;

  // Database
  private db: IDBDatabase | null = null;
  private dbName: string = 'psytrack-db';
  private dbVersion: number = 1;

  // Stores
  private stores: string[] = ['emotionStates', 'timeCapsuleEntries', 'journalEntries', 'userSettings'];

  // Callbacks
  private readyCallbacks: DBReadyCallback[] = [];
  private errorCallbacks: DBErrorCallback[] = [];
  private dataChangeCallbacks: DataChangeCallback[] = [];

  // State
  private isReady: boolean = false;

  private constructor() {
    // Initialize database
    this.initDB();

    console.log('Database Service initialized');
  }

  // Get the singleton instance
  public static getInstance(): DBService {
    if (!DBService.instance) {
      DBService.instance = new DBService();
    }
    return DBService.instance;
  }

  // Initialize the database
  private initDB(): void {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      const error = new Error('IndexedDB is not supported in this browser');
      console.error(error);
      this.notifyError(error);
      return;
    }

    try {
      // Open database
      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      // Handle database upgrade
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('emotionStates')) {
          const emotionStatesStore = db.createObjectStore('emotionStates', { keyPath: 'timestamp' });
          emotionStatesStore.createIndex('mood', 'mood', { unique: false });
          emotionStatesStore.createIndex('confidence', 'confidence', { unique: false });
        }

        if (!db.objectStoreNames.contains('timeCapsuleEntries')) {
          const timeCapsuleEntriesStore = db.createObjectStore('timeCapsuleEntries', { keyPath: 'timestamp' });
          timeCapsuleEntriesStore.createIndex('emotionTag', 'emotionTag', { unique: false });
          timeCapsuleEntriesStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('journalEntries')) {
          const journalEntriesStore = db.createObjectStore('journalEntries', { keyPath: 'timestamp' });
          journalEntriesStore.createIndex('detectedEmotion', 'detectedEmotion', { unique: false });
          journalEntriesStore.createIndex('sentiment', 'sentiment', { unique: false });
        }

        if (!db.objectStoreNames.contains('userSettings')) {
          const userSettingsStore = db.createObjectStore('userSettings', { keyPath: 'id', autoIncrement: true });
        }

        console.log('Database schema created/upgraded');
      };

      // Handle success
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isReady = true;
        console.log('Database opened successfully');

        // Initialize default settings if needed
        this.initDefaultSettings();

        // Notify ready callbacks
        this.notifyReady();
      };

      // Handle error
      request.onerror = (event) => {
        const error = new Error(`Database error: ${(event.target as IDBOpenDBRequest).error}`);
        console.error(error);
        this.notifyError(error);
      };
    } catch (error) {
      console.error('Error initializing database:', error);
      this.notifyError(error as Error);
    }
  }

  // Initialize default settings
  private async initDefaultSettings(): Promise<void> {
    try {
      // Check if settings exist
      const settings = await this.get<UserSettings>('userSettings', 1);

      if (!settings) {
        // Create default settings
        const defaultSettings: UserSettings = {
          storeRawData: false,
          shareWithTherapist: true,
          shareWithCaregivers: false,
          dataRetentionDays: 90,
          anonymizeData: true,
          allowRemoteProcessing: false,
          theme: 'system'
        };

        // Save default settings
        await this.add('userSettings', defaultSettings);
        console.log('Default settings initialized');
      }
    } catch (error) {
      console.error('Error initializing default settings:', error);
    }
  }

  // Add an item to a store
  public async add<T>(storeName: string, item: T): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.isReady || !this.db) {
        reject(new Error('Database not ready'));
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);

        request.onsuccess = () => {
          this.notifyDataChange(storeName);
          resolve(item);
        };

        request.onerror = (event) => {
          reject(new Error(`Error adding item to ${storeName}: ${(event.target as IDBRequest).error}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get an item from a store by key
  public async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.isReady || !this.db) {
        reject(new Error('Database not ready'));
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = (event) => {
          resolve((event.target as IDBRequest).result || null);
        };

        request.onerror = (event) => {
          reject(new Error(`Error getting item from ${storeName}: ${(event.target as IDBRequest).error}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get all items from a store
  public async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.isReady || !this.db) {
        reject(new Error('Database not ready'));
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = (event) => {
          resolve((event.target as IDBRequest).result || []);
        };

        request.onerror = (event) => {
          reject(new Error(`Error getting all items from ${storeName}: ${(event.target as IDBRequest).error}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get items from a store by index
  public async getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.isReady || !this.db) {
        reject(new Error('Database not ready'));
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = (event) => {
          resolve((event.target as IDBRequest).result || []);
        };

        request.onerror = (event) => {
          reject(new Error(`Error getting items by index from ${storeName}: ${(event.target as IDBRequest).error}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Update an item in a store
  public async update<T>(storeName: string, item: T): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.isReady || !this.db) {
        reject(new Error('Database not ready'));
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => {
          this.notifyDataChange(storeName);
          resolve(item);
        };

        request.onerror = (event) => {
          reject(new Error(`Error updating item in ${storeName}: ${(event.target as IDBRequest).error}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Delete an item from a store
  public async delete(storeName: string, key: IDBValidKey): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isReady || !this.db) {
        reject(new Error('Database not ready'));
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          this.notifyDataChange(storeName);
          resolve();
        };

        request.onerror = (event) => {
          reject(new Error(`Error deleting item from ${storeName}: ${(event.target as IDBRequest).error}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Clear a store
  public async clear(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isReady || !this.db) {
        reject(new Error('Database not ready'));
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          this.notifyDataChange(storeName);
          resolve();
        };

        request.onerror = (event) => {
          reject(new Error(`Error clearing store ${storeName}: ${(event.target as IDBRequest).error}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Register callbacks
  public onReady(callback: DBReadyCallback): void {
    this.readyCallbacks.push(callback);

    // If already ready, call immediately
    if (this.isReady) {
      callback();
    }
  }

  public onError(callback: DBErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  public onDataChange(callback: DataChangeCallback): void {
    this.dataChangeCallbacks.push(callback);
  }

  // Remove callbacks
  public removeReadyCallback(callback: DBReadyCallback): void {
    this.readyCallbacks = this.readyCallbacks.filter(cb => cb !== callback);
  }

  public removeErrorCallback(callback: DBErrorCallback): void {
    this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
  }

  public removeDataChangeCallback(callback: DataChangeCallback): void {
    this.dataChangeCallbacks = this.dataChangeCallbacks.filter(cb => cb !== callback);
  }

  // Notify callbacks
  private notifyReady(): void {
    this.readyCallbacks.forEach(callback => callback());
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => callback(error));
  }

  private notifyDataChange(storeName: string): void {
    this.dataChangeCallbacks.forEach(callback => callback(storeName));
  }

  // Close the database
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isReady = false;
      console.log('Database closed');
    }
  }
}

export default DBService;
