import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

// Import Angular Firebase modules and functions
import { initializeApp } from 'firebase/app';

// Firebase configuration object
const firebaseConfig = {
  apiKey: 'AIzaSyBpKsDGhucKO_QbNgjXG3vX1vuduYl8xy4',
  authDomain: 'shopping-list-e939f.firebaseapp.com',
  databaseURL: 'https://shopping-list-e939f-default-rtdb.firebaseio.com/',
  projectId: 'shopping-list-e939f',
  storageBucket: 'shopping-list-e939f.appspot.com',
};

initializeApp(firebaseConfig);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
  ],
};
