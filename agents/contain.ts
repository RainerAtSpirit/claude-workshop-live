/**
 * CLAW DETAINER: Launch Claude Code "in a container" style
 *
 * This script spawns the Claude Code CLI with project-scoped settings and MCP config
 * located in this repository, mirroring the behavior of the old cuse agent without
 * requiring per-project manual setup.
 *
 * Run:
 *   bun run agents/contain.ts            # interactive
 *   bun run agents/contain.ts -p "..."   # print mode, flags pass through
 *
 * Notes on making this global (aliases, PATH):
 * - You can add a zsh alias such as:
 *     alias claw="bun run /Users/youruser/dev/claude-workshop-live/agents/contain.ts"
 *   That lets you launch this preconfigured session anywhere.
 * - Alternatively, add this repo's `bin` to your PATH so any helper scripts here are available:
 *     export PATH="$HOME/dev/claude-workshop-live/bin:$PATH"
 * - Team sharing strategy:
 *     Commit `settings/contain.settings.json` and `settings/contain.mcp.json` to your repo. Standardize
 *     on running this script via `bun run agents/contain.ts` or a small wrapper in `bin/`.
 *     Optionally publish an internal `npx` wrapper that runs this entrypoint with absolute paths.
 */

import { spawn } from "bun";

function resolvePath(relativeFromThisFile: string): string {
    const url = new URL(relativeFromThisFile, import.meta.url);
    return url.pathname;
}

const projectRoot = resolvePath("../");
const settingsPath = resolvePath("../settings/contain.settings.json");
const mcpPath = resolvePath("../settings/contain.mcp.json");

const args = [
    "--settings",
    settingsPath,
    "--mcp-config",
    mcpPath,
    ...process.argv.slice(2),
];

const child = spawn(["claude", ...args], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: {
        ...process.env,
        CLAUDE_PROJECT_DIR: projectRoot,
    },
});

const onExit = () => {
    try {
        child.kill("SIGTERM");
    } catch { }
};

process.on("SIGINT", onExit);
process.on("SIGTERM", onExit);

await child.exited;
process.exit(child.exitCode ?? 0);


