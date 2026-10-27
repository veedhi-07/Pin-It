import { createBoardSchema, savePinSchema, updateBoardSchema } from "@pinboard/shared";
import { prisma } from "../../lib/prisma.js";
import { HttpError, publicUser } from "../../lib/http.js";
import { canViewBoard, isPinVisible } from "../pins/visibility.js";

export async function createBoard(ownerId: string, input: unknown) {
  const data = createBoardSchema.parse(input);
  const board = await prisma.board.create({
    data: { ownerId, name: data.name, isPrivate: data.isPrivate ?? false },
    include: { owner: true, pins: true },
  });
  return serializeBoard(board);
}

export async function listBoards(viewerId?: string, ownerId?: string) {
  const boards = await prisma.board.findMany({
    where: ownerId ? { ownerId } : undefined,
    include: { owner: true, pins: true },
    orderBy: { updatedAt: "desc" },
  });
  return boards.filter((board) => canViewBoard(board, viewerId)).map(serializeBoard);
}

export async function getBoard(id: string, viewerId?: string) {
  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      owner: true,
      pins: { include: { pin: { include: { owner: true, boardPins: { include: { board: true } } } } } },
    },
  });
  if (!board || !canViewBoard(board, viewerId)) {
    throw new HttpError(404, "Board not found");
  }
  return {
    ...serializeBoard(board),
    pins: board.pins
      .map((bp) => bp.pin)
      .filter((pin) => isPinVisible(pin, viewerId))
      .map((pin) => ({
        id: pin.id,
        ownerId: pin.ownerId,
        owner: publicUser(pin.owner),
        mediaType: pin.mediaType,
        mediaPublicId: pin.mediaPublicId,
        mediaUrl: pin.mediaUrl,
        thumbnailUrl: pin.thumbnailUrl,
        title: pin.title,
        description: pin.description,
        tags: pin.tags,
        createdAt: pin.createdAt.toISOString(),
        savedBoardIds: pin.boardPins.map((item) => item.boardId),
      })),
  };
}

export async function updateBoard(id: string, ownerId: string, input: unknown) {
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board) throw new HttpError(404, "Board not found");
  if (board.ownerId !== ownerId) throw new HttpError(403, "Only the owner can edit this board");
  const data = updateBoardSchema.parse(input);
  const updated = await prisma.board.update({
    where: { id },
    data,
    include: { owner: true, pins: true },
  });
  return serializeBoard(updated);
}

export async function deleteBoard(id: string, ownerId: string) {
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board) throw new HttpError(404, "Board not found");
  if (board.ownerId !== ownerId) throw new HttpError(403, "Only the owner can delete this board");
  await prisma.board.delete({ where: { id } });
}

export async function savePin(boardId: string, ownerId: string, input: unknown) {
  const { pinId } = savePinSchema.parse(input);
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new HttpError(404, "Board not found");
  if (board.ownerId !== ownerId) throw new HttpError(403, "Only the board owner can save pins");
  const pin = await prisma.pin.findUnique({
    where: { id: pinId },
    include: { boardPins: { include: { board: true } } },
  });
  if (!pin || !isPinVisible(pin, ownerId)) throw new HttpError(404, "Pin not found");
  await prisma.boardPin.upsert({
    where: { boardId_pinId: { boardId, pinId } },
    update: {},
    create: { boardId, pinId },
  });
  return getBoard(boardId, ownerId);
}

export async function removePin(boardId: string, pinId: string, ownerId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new HttpError(404, "Board not found");
  if (board.ownerId !== ownerId) throw new HttpError(403, "Only the board owner can remove pins");
  await prisma.boardPin.deleteMany({ where: { boardId, pinId } });
  return getBoard(boardId, ownerId);
}

function serializeBoard(board: {
  id: string;
  ownerId: string;
  name: string;
  isPrivate: boolean;
  createdAt: Date;
  owner: { id: string; email: string; name: string; avatarUrl: string | null };
  pins: unknown[];
}) {
  return {
    id: board.id,
    ownerId: board.ownerId,
    owner: publicUser(board.owner),
    name: board.name,
    isPrivate: board.isPrivate,
    pinCount: board.pins.length,
    createdAt: board.createdAt.toISOString(),
  };
}
