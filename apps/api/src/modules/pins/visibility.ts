import { prisma } from "../../lib/prisma.js";

export async function canViewPin(pinId: string, viewerId?: string | null): Promise<boolean> {
  const pin = await prisma.pin.findUnique({
    where: { id: pinId },
    include: { boardPins: { include: { board: true } } },
  });
  if (!pin) return false;
  return isPinVisible(pin, viewerId);
}

export function isPinVisible(
  pin: {
    ownerId: string;
    boardPins: { board: { isPrivate: boolean; ownerId: string } }[];
  },
  viewerId?: string | null,
) {
  if (viewerId && pin.ownerId === viewerId) return true;
  if (pin.boardPins.length === 0) return true;
  const onPublicBoard = pin.boardPins.some((bp) => !bp.board.isPrivate);
  if (onPublicBoard) return true;
  if (!viewerId) return false;
  return pin.boardPins.some((bp) => bp.board.ownerId === viewerId);
}

export function canViewBoard(board: { isPrivate: boolean; ownerId: string }, viewerId?: string | null) {
  if (!board.isPrivate) return true;
  return Boolean(viewerId && board.ownerId === viewerId);
}
