import { spawnSync } from "node:child_process";

process.env.NEXT_TELEMETRY_DISABLED = "1";

const result = spawnSync("npx", ["next", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
