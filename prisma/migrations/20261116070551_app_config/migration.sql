-- CreateTable
CREATE TABLE "app_config" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_config_companyId_key" ON "app_config"("companyId");

-- AddForeignKey
ALTER TABLE "app_config" ADD CONSTRAINT "app_config_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
