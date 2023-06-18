/// <reference types="@types/jest" />
import 'whatwg-fetch';

import { setLogger } from 'react-query';

Object.defineProperty(window, 'matchMedia', {
  value: () => {
    return {
      matches: false,
      addListener: () => {
        // Do nothing.
      },
      removeListener: () => {
        // Do nothing.
      },
    };
  },
});

setLogger({
  log: () => {
    // No log
  },
  warn: () => {
    // No log
  },
  error: () => {
    // No log
  },
});
