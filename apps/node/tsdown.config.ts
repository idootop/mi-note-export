import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/download.ts"],
	outDir: "dist",
	target: "node20",
	noExternal: [/.*/],
});
