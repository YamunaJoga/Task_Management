import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import taskReducer from './slices/taskSlice';
import documentReducer from './slices/documentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    documents: documentReducer
  }
});