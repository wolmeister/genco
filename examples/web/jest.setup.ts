/// <reference types="@types/jest" />
import 'whatwg-fetch';

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
