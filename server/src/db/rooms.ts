interface Room {
  _id: string;
  users: string[];
}

export const roomsMap = new Map<string, Room>();
