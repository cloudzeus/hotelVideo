import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Prisma CLI only loads .env by default; load .env.local too (it wins), so
// migrate/studio/seed see the same vars as Next.js.
config({ path: '.env' })
config({ path: '.env.local', override: true })

export default defineConfig({
    datasource: {
        // CLI (migrate/db push/studio) must bypass PgBouncer → use the direct connection.
        // Runtime uses the pooled DATABASE_URL via the pg adapter in src/lib/prisma.ts.
        url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
    },
})
