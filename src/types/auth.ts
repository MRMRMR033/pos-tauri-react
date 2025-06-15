// src/types/auth.ts
export interface User {
    id: number;
    email: string
  }
  
  export interface AuthData {
    accessToken: string;
  }
  
  export interface Credentials {
    email: string;
    password: string;
  }