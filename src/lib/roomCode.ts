import { customAlphabet } from 'nanoid'

/** 5-character room codes — short enough to read aloud, alphabet trimmed of look-alikes (0/O, 1/I). */
export const generateRoomCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5)
