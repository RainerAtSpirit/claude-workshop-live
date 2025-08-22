#!/usr/bin/env bun

import { spawn } from "bun";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ClaudeFlags } from "../lib/claude-flags.types";
import { buildClaudeFlags, getPositionals, parsedArgs } from "../lib/flags";
import brainstormMcp from "../settings/brainstorm.mcp.json" with {
	type: "json",
};
import brainstormSettings from "../settings/brainstorm.settings.json" with {
	type: "json",
};
import brainstormSystemPrompt from "../system-prompts/brainstorm-prompt.md" with {
	type: "text",
};

// Read user's idea from args
const positionals = getPositionals();
const idea = positionals.join(" ");

if (!idea) {
	console.error("Please provide an idea to brainstorm about");
	console.error("Usage: brainstorm 'your idea here'");
	process.exit(1);
}

// Create temporary file for the brainstorming session
const tempFile = join(tmpdir(), `brainstorm-${Date.now()}.md`);
const initialContent = `# AI Agent Brainstorming Session

## Your Idea:
${idea}

## Instructions:
I will generate 5 different AI agent variations based on your idea. Each will have:
- A unique name and purpose
- Key capabilities and tools
- Use cases and examples
- Implementation approach

After I present the options, you can select one to develop further.

---

`;

writeFileSync(tempFile, initialContent);

// Build the user prompt
const userPrompt = `Please brainstorm 5 different AI agent variations based on this idea:

"${idea}"

Present them in a clear, numbered format and then ask which one I'd like to explore further.`;

async function main() {
	// Build Claude flags
	const flags: ClaudeFlags = buildClaudeFlags({
		...parsedArgs,
		settings: brainstormSettings,
		"mcp-config": [brainstormMcp],
		"append-system-prompt": brainstormSystemPrompt,
	});

	// Add the prompt as positional argument
	const args = [...flags, userPrompt];

	// Spawn Claude with brainstorm settings
	const claudeProcess = spawn(["claude", ...args], {
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
		env: {
			...process.env,
			CLAUDE_PROJECT_DIR: process.cwd(),
		},
	});

	await claudeProcess.exited;
	console.log(`\n✨ Brainstorming session saved to: ${tempFile}`);
}

main().catch(console.error);
