/**
 * Extension metadata — the shape used by UI state factories.
 *
 * In the PI-integrated path, there is NO scope resolution.
 * The extension name is fixed to 'cfxdevkit-repo-agent'.
 */

export interface PiAgentExtension {
  readonly name: 'cfxdevkit-repo-agent';
  readonly resources: {
    readonly settingsPath: string;
    readonly promptPath: string;
    readonly skillPath: string;
    readonly extensionPath: string;
  };
}
