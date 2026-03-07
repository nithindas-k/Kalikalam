import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response.util";
import { MESSAGES } from "../constants/messages";

interface AppError extends Error {
    status?: number;
}

export const errorMiddleware = (
    err: AppError,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
): void => {
    const status = err.status || 500;
    const message = err.message || MESSAGES.INTERNAL_ERROR;

    console.error(`❌ [${req.method}] ${req.url} Error:`, {
        status,
        message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });

    res.status(status).json(errorResponse(message));
};
