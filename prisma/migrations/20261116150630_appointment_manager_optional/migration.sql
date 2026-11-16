-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_managerId_fkey";

-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "managerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
