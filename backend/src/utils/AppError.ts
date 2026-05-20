// A custom error class that carries an HTTP status code alongside the message.
// Throwing an AppError from any service or middleware will be caught by the
// global errorHandler, which uses the statusCode to set the HTTP response status.
// Any other error type is treated as an unexpected 500.
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
