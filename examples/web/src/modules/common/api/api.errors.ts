export type ApiError = {
  json: {
    statusCode: number;
    code: string;
    message: string;
    error: string;
  };
};

export function isApiError(error: unknown): error is ApiError {
  if (error === undefined || error === null) {
    return false;
  }

  if (typeof error === 'object' && 'json' in error) {
    const jsonError = error.json;
    if (jsonError === null) {
      return false;
    }
    return typeof jsonError === 'object' && Object.keys(jsonError).length > 0;
  }
  return false;
}
