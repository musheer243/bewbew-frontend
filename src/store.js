import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducers/authReducer"; // Ensure the file exists

const store = configureStore({
  reducer: {
    auth: authReducer, 
  },
});

export default store;
