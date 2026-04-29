import { CfxError } from '@cfxdevkit/core';

export type DevNodeErrorCode =
  | 'devnode/already-running'
  | 'devnode/not-running'
  | 'devnode/start-failed'
  | 'devnode/stop-failed'
  | 'devnode/mining-already-running'
  | 'devnode/mining-not-running'
  | 'devnode/invalid-config';

/** Error type thrown by every helper in this package. */
export class DevNodeError extends CfxError {
  override readonly code: DevNodeErrorCode;
  constructor(input: {
    code: DevNodeErrorCode;
    message: string;
    cause?: unknown;
    meta?: Record<string, unknown>;
  }) {
    const init: {
      code: DevNodeErrorCode;
      message: string;
      cause?: unknown;
      meta?: Record<string, unknown>;
    } = { code: input.code, message: input.message };
    if (input.cause !== undefined) init.cause = input.cause;
    if (input.meta !== undefined) init.meta = input.meta;
    super(init);
    this.code = input.code;
    this.name = 'DevNodeError';
  }
}
