import { usersMap } from "./users";

export const sessionsMap = new Map<string, string>();

export function createSession(userId: string) {
  const sessionId = crypto.randomUUID();
  sessionsMap.set(sessionId, userId);

  return sessionId;
}

export function getUserFromSession(sessionId: string) {
  const userId = sessionsMap.get(sessionId);
  if (!userId) return null;

  const user = usersMap.get(userId);
  if (!user) return null;

  return { id: userId, ...user };
}
