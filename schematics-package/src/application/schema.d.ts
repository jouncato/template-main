export interface ApplicationOptions {
  /**
   * The name of the application.
   */
  name: string;

  /**
   * The directory name to create.
   */
  directory?: string;

  /**
   * Package manager to use (npm, yarn, pnpm).
   */
  packageManager?: 'npm' | 'yarn' | 'pnpm';

  /**
   * Skip git repository initialization.
   */
  skipGit?: boolean;

  /**
   * Skip package installation.
   */
  skipInstall?: boolean;

  /**
   * Enable strict mode in TypeScript.
   */
  strict?: boolean;
}
