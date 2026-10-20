import StackTrace from 'stacktrace-js';
import { safeJSONStringify } from './utils';

interface FormattedError {
  message: string;
  stack: string;
}

export async function formatStackTrace(
  error: unknown
): Promise<FormattedError> {
  let message = error?.toString?.() || 'Undefined error';

  let stack = '';
  if (error instanceof Error) {
    try {
      const stackFrames = await StackTrace.fromError(error);
      stack = stackFrames.map((frame) => frame.toString()).join('\n');
    } catch (e) {
      stack = `Error parsing stack trace: ${e}\nOriginal stack trace:\n${error.stack}`;
    }
  }

  return { message, stack };
}

export interface ParsedError {
  name: string;
  message: string;
  stack?: string;
  status?: number | string;
  code?: string;
}

export function parseError(error: unknown): ParsedError | undefined {
  if (!error) {
    return undefined;
  }
  if (typeof error === 'string') {
    return { message: error, name: 'Error' };
  }
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }
  if (typeof error === 'object') {
    const e = error as any;

    // RTKQ FetchBaseQueryError often has:
    // { status, data, error }
    const status = e.status;
    const code = e.code;

    // Common places messages live:
    const candidates: unknown[] = [
      e.message,
      e.error,
      e.data?.message,
      e.data?.error,
      e.data, // sometimes data is just a string
    ];

    const message =
      candidates.map(asString).find((s) => s && s.trim().length > 0) ??
      safeJSONStringify(e);

    const name = typeof e.name === 'string' && e.name ? e.name : 'Error';

    return { message, name, status, code };
  }
  return { message: String(error), name: 'Error' };
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return undefined;
  }
  return safeJSONStringify(value);
}
