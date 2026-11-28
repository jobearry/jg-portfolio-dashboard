import { HttpErrorResponse } from '@angular/common/http';
import type { ProblemDetails } from '../../features/dashboard/core/models/problem-details';

const FALLBACK_MESSAGE = 'Something went wrong while loading this section.';

/**
 * Turns an unknown request failure into a message that is safe to render.
 * Never leaks response bodies or stack traces into the UI.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Could not reach the portfolio API. Check your connection and try again.';
    }

    return `The portfolio API returned an error (${error.status}). Please try again.`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return FALLBACK_MESSAGE;
}

/**
 * Renders an API `ProblemDetails` message before falling back to the generic
 * status text. Used by admin forms where the server explains validation errors.
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
    const problem = error.error as ProblemDetails;
    const detail = problem.detail?.trim();
    if (detail) {
      return detail;
    }

    const title = problem.title?.trim();
    if (title) {
      return title;
    }
  }

  return getErrorMessage(error);
}
