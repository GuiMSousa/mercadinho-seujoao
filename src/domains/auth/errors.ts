/** A refused request the caller should see; routes turn it into a form error with this status. */
export class ServiceError extends Error {
  constructor(
    readonly status: 404 | 409 | 422 | 429,
    message: string,
    readonly options: {
      fields?: Record<string, string>;
      retryAfterSeconds?: number;
    } = {},
  ) {
    super(message);
  }
}
