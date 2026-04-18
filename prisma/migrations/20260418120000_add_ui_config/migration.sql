-- CreateTable
CREATE TABLE "UiConfig" (
    "id" INTEGER NOT NULL,
    "showroomHidden" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UiConfig_pkey" PRIMARY KEY ("id")
);
