/**
 * Resolve the user's home directory, preferring environment variables over
 * os.homedir(). On Linux, os.homedir() reads from /etc/passwd which can
 * return a stale path after a user rename (usermod -l). The $HOME env var
 * is set by the login process and reflects the current session.
 */
export declare function resolveHome(): string;
