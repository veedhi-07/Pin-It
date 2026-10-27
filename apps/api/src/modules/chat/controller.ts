import type { Request, Response } from "express";
import * as chatService from "./service.js";

export async function createDm(req: Request, res: Response) {
  const conversation = await chatService.createDm(req.user!.sub, req.body);
  res.status(201).json({ conversation });
}

export async function createGroup(req: Request, res: Response) {
  const conversation = await chatService.createGroup(req.user!.sub, req.body);
  res.status(201).json({ conversation });
}

export async function list(req: Request, res: Response) {
  const conversations = await chatService.listConversations(req.user!.sub);
  res.json({ conversations });
}

export async function get(req: Request, res: Response) {
  const conversation = await chatService.getConversation(req.params.id, req.user!.sub);
  res.json({ conversation });
}

export async function members(req: Request, res: Response) {
  const conversation = await chatService.updateMembers(req.params.id, req.user!.sub, req.body);
  res.json({ conversation });
}

export async function messages(req: Request, res: Response) {
  const messages = await chatService.listMessages(req.params.id, req.user!.sub);
  res.json({ messages });
}

export async function send(req: Request, res: Response) {
  const message = await chatService.createMessage(req.params.id, req.user!.sub, req.body);
  res.status(201).json({ message });
}
