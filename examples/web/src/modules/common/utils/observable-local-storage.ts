export type ObserveCallback = (newValue: string | null) => void;
export type ObserveCleanup = () => void;

class ObservableLocalStorage {
  private observers: Map<string, Set<ObserveCallback>> = new Map();

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);

    const keyObservers = this.observers.get(key);
    if (keyObservers) {
      keyObservers.forEach(observer => observer(value));
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);

    const keyObservers = this.observers.get(key);
    if (keyObservers) {
      keyObservers.forEach(observer => observer(null));
    }
  }

  observeItem(key: string, callback: ObserveCallback): ObserveCleanup {
    const keyObservers = this.observers.get(key) ?? new Set();
    if (keyObservers.size === 0) {
      this.observers.set(key, keyObservers);
    }
    keyObservers.add(callback);

    // Observe changes in other tabs
    const storageEventListener = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) {
        return;
      }

      if (event.key === key) {
        callback(event.newValue);
      }
    };
    window.addEventListener('storage', storageEventListener);

    return () => {
      window.removeEventListener('storage', storageEventListener);

      keyObservers.delete(callback);
      if (keyObservers.size === 0) {
        this.observers.delete(key);
      }
    };
  }
}

export const observableLocalStorage = new ObservableLocalStorage();

// This is used to help with debugging.
const typedWindow = window as unknown as Window & {
  observableLocalStorage: ObservableLocalStorage;
};
typedWindow.observableLocalStorage = observableLocalStorage;
