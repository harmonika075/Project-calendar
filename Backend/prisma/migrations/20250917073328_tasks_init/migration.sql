/*
  Warnings:

  - You are about to drop the column `notes` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `allocationPercent` on the `TaskAssignment` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "colorHex" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Task" ("createdAt", "endDate", "id", "startDate", "title") SELECT "createdAt", "endDate", "id", "startDate", "title" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE TABLE "new_TaskAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskAssignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskAssignment" ("id", "personId", "taskId") SELECT "id", "personId", "taskId" FROM "TaskAssignment";
DROP TABLE "TaskAssignment";
ALTER TABLE "new_TaskAssignment" RENAME TO "TaskAssignment";
CREATE UNIQUE INDEX "TaskAssignment_taskId_personId_key" ON "TaskAssignment"("taskId", "personId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
