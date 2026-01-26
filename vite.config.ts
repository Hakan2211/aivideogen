import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { serverOnlyPlugin } from './vite-plugin-server-only'

// Vite configuration for TanStack Start with Nitro
//
// NOTE: Server-only files use the .server.ts naming convention.
// The serverOnlyPlugin stubs these files during CLIENT PRODUCTION builds
// to prevent server-only code (Prisma, Node.js crypto, etc.) from being bundled.
//
// TanStack Start's createServerFn automatically creates RPC stubs for
// client-side calls, so the actual function bodies are never needed on the client.
const config = defineConfig({
  plugins: [
    // Server-only plugin MUST be first to intercept .server.ts imports
    // before other plugins process them
    serverOnlyPlugin(),
    devtools(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    nitroV2Plugin(),
    viteReact(),
  ],
  ssr: {
    external: [
      '@prisma/client',
      '@prisma/adapter-better-sqlite3',
      'better-sqlite3',
    ],
  },
  optimizeDeps: {
    exclude: ['@tanstack/start-server-core', '@tanstack/react-start'],
  },
})

export default config
