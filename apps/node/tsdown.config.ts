import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/sync.ts"],
	outDir: "dist",
	target: "node20",
	noExternal: [/.*/],
});
