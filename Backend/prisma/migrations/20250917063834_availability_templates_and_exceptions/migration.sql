/*
  Warnings:

  - A unique constraint covering the columns `[personId,date,startMinute,endMinute]` on the table `AvailabilitySlot` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "DefaultWorkingHour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    CONSTRAINT "DefaultWorkingHour_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Unavailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    CONSTRAINT "Unavailability_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DefaultWorkingHour_personId_weekday_key" ON "DefaultWorkingHour"("personId", "weekday");

-- CreateIndex
CREATE INDEX "Unavailability_personId_date_idx" ON "Unavailability"("personId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_personId_date_startMinute_endMinute_key" ON "AvailabilitySlot"("personId", "date", "startMinute", "endMinute");
