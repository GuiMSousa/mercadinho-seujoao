/** A refused request the caller should see; routes turn it into a form error with this status. */
export class ServiceError extends Error {
  constructor(
    // 502: a provider the request depends on (the e-mail service) failed.
    readonly status: 401 | 404 | 409 | 422 | 429 | 502,
    message: string,
    readonly options: {
      fields?: Record<string, string>;
      retryAfterSeconds?: number;
    } = {},
  ) {
    super(message);
  }
}
