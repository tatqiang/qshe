import { configureStore } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import usersReducer from './usersSlice';
import preRegistrationReducer from './preRegistrationSlice';

// Logger middleware for development
const logger: Middleware = (store) => (next) => (action: any) => {
  if (import.meta.env.DEV) {
    console.group(action.type || 'Action');
    console.info('dispatching', action);
    const result = next(action);
    console.log('next state', store.getState());
    console.groupEnd();
    return result;
  }
  return next(action);
};

// Create the store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    preRegistration: preRegistrationReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in these paths for better developer experience
        ignoredActions: ['auth/setUser', 'users/setCurrentUser', 'users/fetchUsers/fulfilled', 'users/updateUsersForTesting'],
        ignoredPaths: [
          'auth.user', 
          'users.currentUser', 
          'users.users',
          // Ignore face descriptors which contain Float32Array
          'users.users.faceDescriptors',
          'users.currentUser.faceDescriptors'
        ],
        // Custom function to check if a value is serializable
        isSerializable: (value: any) => {
          // Allow Float32Array instances to pass through without warnings
          if (value instanceof Float32Array) {
            return true;
          }
          // For all other values, use default serialization check
          return typeof value !== 'object' || value === null || Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype;
        }
      }
    }).concat(logger),
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
