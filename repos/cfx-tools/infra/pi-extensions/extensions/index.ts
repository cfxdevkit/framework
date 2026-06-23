import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

import sessionState from './00-session-state';
import promptCustomizer from './01-prompt-customizer';

export default function piExtensions(pi: ExtensionAPI): void {
  // Phase 3: Session state (dirty repo guard, checkpoint, persistence)
  sessionState(pi);

  // Phase 6: Prompt customizer
  promptCustomizer(pi);
}
