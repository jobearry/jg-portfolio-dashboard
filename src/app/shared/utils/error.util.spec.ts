import { HttpErrorResponse } from '@angular/common/http';
import { getApiErrorMessage, getErrorMessage } from './error.util';

describe('error utilities', () => {
  function httpError(status: number, body: unknown): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: 'Error', error: body });
  }

  it('getApiErrorMessage_WhenProblemDetailsHaveDetail_ReturnsDetail', () => {
    const error = httpError(400, { title: 'Bad Request', detail: 'Company is required.' });

    expect(getApiErrorMessage(error)).toBe('Company is required.');
  });

  it('getApiErrorMessage_WhenDetailIsMissing_ReturnsTitle', () => {
    const error = httpError(404, { title: 'Experience not found' });

    expect(getApiErrorMessage(error)).toBe('Experience not found');
  });

  it('getApiErrorMessage_WhenBodyHasNoUsableMessage_FallsBackToStatusMessage', () => {
    const error = httpError(503, { title: '', detail: null });

    expect(getApiErrorMessage(error)).toBe(getErrorMessage(error));
  });
});
