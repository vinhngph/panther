import { defineConfig } from "vite"
import path from "path"

export default defineConfig(({ mode }) => {
    if (!mode) {
        throw new Error(`Unknown entry: ${mode}`)
    }

    return {
        build: {
            outDir: "src/bundle",
            emptyOutDir: false,
            rollupOptions: {
                input: path.resolve(__dirname, `src/services/${mode}.js`),
                output: {
                    inlineDynamicImports: true,
                    format: "iife",
                    entryFileNames: "[name].bundle.js",
                }
            },
            minify: "terser"
        }
    }
})