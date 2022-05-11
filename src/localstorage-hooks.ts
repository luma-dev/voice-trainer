import { useState } from 'react';

const lsFallbackKey = '_localStorageFallback';
const glob: any = (() => {
  if (typeof window !== 'undefined') return window;
  if (typeof globalThis !== 'undefined') return globalThis;
  return global;
})();

const lsFallbackKeyOf = (key: string): string => `::${key}`;

export const isFallingback = () => {
  return Boolean(glob[lsFallbackKey]);
};

const getItem = (key: string): string | null => {
  if (isFallingback() && lsFallbackKeyOf(key) in glob[lsFallbackKey]) {
    return glob[lsFallbackKey][lsFallbackKeyOf(key)];
  }
  return localStorage.getItem(key);
};

const setItem = (key: string, value: string) => {
  if (isFallingback()) {
    glob[lsFallbackKey][lsFallbackKeyOf(key)] = value;
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    glob[lsFallbackKey] = {
      [lsFallbackKeyOf(key)]: value,
    };
  }
};

export const useLocalStorageInteger = (
  key: string,
  defaultValue: number,
): [number, React.Dispatch<React.SetStateAction<number>>] => {
  const value = (() => {
    try {
      const item = getItem(key);
      if (item === null) return defaultValue;
      const val = JSON.parse(item);
      if (Number.isInteger(val)) return val;
      return defaultValue;
    } catch {
      return defaultValue;
    }
  })();
  const [, setState] = useState({});
  const dispatcher = (a: any) => {
    if (typeof a === 'function') {
      setItem(key, JSON.stringify(a(value)));
      setState({});
      return;
    }
    setItem(key, JSON.stringify(a));
    setState({});
  };
  return [value, dispatcher];
};

export const useLocalStorageString = (
  key: string,
  defaultValue: string,
): [string, React.Dispatch<React.SetStateAction<string>>] => {
  const value = (() => {
    try {
      const item = getItem(key);
      if (item === null) return defaultValue;
      const val = JSON.parse(item);
      if (typeof val === 'string') return val;
      return defaultValue;
    } catch {
      return defaultValue;
    }
  })();
  const [, setState] = useState({});
  const dispatcher = (a: any) => {
    if (typeof a === 'function') {
      setItem(key, JSON.stringify(a(value)));
      setState({});
      return;
    }
    setItem(key, JSON.stringify(a));
    setState({});
  };
  return [value, dispatcher];
};
