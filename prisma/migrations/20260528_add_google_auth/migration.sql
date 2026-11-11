PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "picture" TEXT,
    "googleId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_User" ("id", "email", "name", "picture", "googleId", "role", "createdAt", "updatedAt")
SELECT "id", "email", "name", NULL, NULL, "role", "createdAt", CURRENT_TIMESTAMP
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

PRAGMA foreign_keys=ON;
