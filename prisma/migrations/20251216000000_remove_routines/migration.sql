-- DropForeignKey
ALTER TABLE "routines" DROP CONSTRAINT IF EXISTS "routines_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "routines";

