import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  documents: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: ''
};

export const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    }
  }
});

export const { reset } = documentSlice.actions;
export default documentSlice.reducer;