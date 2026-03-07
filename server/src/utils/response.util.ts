export const successResponse = (message: string, data: unknown) => ({
    success: true,
    message,
    data,
});

export const errorResponse = (message: string, error?: unknown) => ({
    success: false,
    message,
    error: error instanceof Error ? error.message : error,
});
