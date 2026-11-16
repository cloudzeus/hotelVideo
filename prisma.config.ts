import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
    datasource: {
        // CLI (migrate/db push/studio) must bypass PgBouncer → use the direct connection.
        // Runtime uses the pooled DATABASE_URL via the pg adapter in src/lib/prisma.ts.
        url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
    },
})
