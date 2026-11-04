/**
 * Penanganan Error Terpusat & Terstandarisasi
 * Mengikuti pedoman keamanan dan UI-UX-RULES.md (Bahasa Indonesia ramah & jelas)
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors?: Record<string, string[]> | undefined;

  constructor(
    message = "Data yang dikirim tidak valid atau belum lengkap.",
    fieldErrors?: Record<string, string[]> | undefined
  ) {
    super(message, 400, "VALIDATION_ERROR");
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sesi Anda telah berakhir atau Anda belum masuk.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Anda tidak memiliki izin untuk melakukan tindakan ini.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Data atau halaman yang Anda cari tidak ditemukan.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Terjadi konflik dengan data yang sudah ada.") {
    super(message, 409, "CONFLICT");
  }
}

/**
 * Format error untuk respon API yang aman bagi pengguna.
 */
export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError && error.isOperational) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error instanceof ValidationError &&
          error.fieldErrors && { fieldErrors: error.fieldErrors }),
      },
    };
  }

  // Log error teknis secara internal
  console.error("Unhandled Error:", error);

  return {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.",
    },
  };
}
