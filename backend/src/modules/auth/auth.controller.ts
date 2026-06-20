import { Request, Response } from "express";
import { asyncHandler } from "@/middleware/asyncHandler";
import { authService } from "./auth.service";
import { LoginInput, RegisterInput } from "./auth.validation";

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body as RegisterInput);
    res.status(201).json(result);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body as LoginInput);
    res.status(200).json(result);
  })
};
