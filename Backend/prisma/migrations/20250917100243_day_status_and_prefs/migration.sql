-- CreateTable
CREATE TABLE "AvailabilityDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "AvailabilityDay_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonPrefs" (
    "personId" TEXT NOT NULL PRIMARY KEY,
    "workdaysMask" INTEGER NOT NULL DEFAULT 62,
    CONSTRAINT "PersonPrefs_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityDay_personId_date_key" ON "AvailabilityDay"("personId", "date");
