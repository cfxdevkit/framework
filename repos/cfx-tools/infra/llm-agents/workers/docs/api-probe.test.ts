import { describe, expect, it } from 'vitest';
import { parseDocsApiProbeResponse } from './api-probe.ts';

describe('parseDocsApiProbeResponse', () => {
  it('accepts the line protocol response', () => {
    expect(parseDocsApiProbeResponse('OK|@cfxdevkit/executor|# `@cfxdevkit/executor` — Public API|yes')).toEqual({
      status: 'ok',
      package: '@cfxdevkit/executor',
      firstHeading: '# `@cfxdevkit/executor` — Public API',
      hasTsFence: true,
    });
  });

  it('accepts a JSON fallback response', () => {
    expect(
      parseDocsApiProbeResponse(
        JSON.stringify({
          status: 'ok',
          package: '@cfxdevkit/executor',
          firstHeading: '# `@cfxdevkit/executor` — Public API',
          hasTsFence: true,
        }),
      ),
    ).toEqual({
      status: 'ok',
      package: '@cfxdevkit/executor',
      firstHeading: '# `@cfxdevkit/executor` — Public API',
      hasTsFence: true,
    });
  });
});