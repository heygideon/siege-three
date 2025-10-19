import { type } from "arktype";

interface User {
  _id: string;
  name: string;
}

export const usersMap = new Map<string, User>();
