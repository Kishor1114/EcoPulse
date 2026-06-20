import { Router, Request, Response } from "express";
import { asyncHandler } from "@/middleware/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { gamificationService } from "./gamification.service";

export const gamificationRouter = Router();
gamificationRouter.use(requireAuth);

gamificationRouter.get(
  "/state",
  asyncHandler(async (req: Request, res: Response) => {
    const state = gamificationService.getState(req.user!.id);
    res.json(state);
  })
);
