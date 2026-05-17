import { type ConfluxDevkitClient, createConfluxDevkitClient } from '@cfxdevkit/client';

export const showcaseRuntimeClient: ConfluxDevkitClient = createConfluxDevkitClient({
  baseUrl: '/api',
});
