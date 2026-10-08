import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
// import { provideClientHydration } from '@angular/platform-browser';

// Import Angular Firebase modules and functions
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

// Firebase configuration object
const firebaseConfig = {
  apiKey: 'AIzaSyBpKsDGhucKO_QbNgjXG3vX1vuduYl8xy4',
  authDomain: 'shopping-list-e939f.firebaseapp.com',
  databaseURL: 'https://shopping-list-e939f-default-rtdb.firebaseio.com/',
  projectId: 'shopping-list-e939f',
  storageBucket: 'shopping-list-e939f.appspot.com',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // provideClientHydration(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
  ],
};
