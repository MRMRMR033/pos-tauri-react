// src/types/auth.ts
export interface User {
    id: number;
    email: string
  }
  
  export interface AuthData {
    accessToken: string;
    refreshToken: string;
    user: User;
  }
  
  export interface Credentials {
    email: string;
    password: string;
  }
  