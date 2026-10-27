import type { Request, Response } from "express";
import * as boardService from "./service.js";

export async function create(req: Request, res: Response) {
  const board = await boardService.createBoard(req.user!.sub, req.body);
  res.status(201).json({ board });
}

export async function list(req: Request, res: Response) {
  const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : undefined;
  const boards = await boardService.listBoards(req.user?.sub, ownerId);
  res.json({ boards });
}

export async function get(req: Request, res: Response) {
  const board = await boardService.getBoard(req.params.id, req.user?.sub);
  res.json({ board });
}

export async function update(req: Request, res: Response) {
  const board = await boardService.updateBoard(req.params.id, req.user!.sub, req.body);
  res.json({ board });
}

export async function remove(req: Request, res: Response) {
  await boardService.deleteBoard(req.params.id, req.user!.sub);
  res.json({ ok: true });
}

export async function save(req: Request, res: Response) {
  const board = await boardService.savePin(req.params.id, req.user!.sub, req.body);
  res.json({ board });
}

export async function unsave(req: Request, res: Response) {
  const board = await boardService.removePin(req.params.id, req.params.pinId, req.user!.sub);
  res.json({ board });
}
