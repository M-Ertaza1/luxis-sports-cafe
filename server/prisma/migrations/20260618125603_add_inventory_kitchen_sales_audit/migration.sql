-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('STOCK', 'FRESH_ON_DEMAND');

-- CreateEnum
CREATE TYPE "Kitchen" AS ENUM ('MAIN', 'COUNTER');

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemRecipe" (
    "id" TEXT NOT NULL,
    "finishedItemId" TEXT NOT NULL,
    "ingredientItemId" TEXT NOT NULL,
    "quantityRequired" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "ItemRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenStock" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "kitchen" "Kitchen" NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL DEFAULT 0,

    CONSTRAINT "KitchenStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenTransfer" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "fromKitchen" "Kitchen" NOT NULL,
    "toKitchen" "Kitchen" NOT NULL,
    "transferredById" TEXT NOT NULL,
    "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KitchenTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "kitchen" "Kitchen" NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "soldById" TEXT NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KitchenStock_itemId_kitchen_key" ON "KitchenStock"("itemId", "kitchen");

-- AddForeignKey
ALTER TABLE "ItemRecipe" ADD CONSTRAINT "ItemRecipe_finishedItemId_fkey" FOREIGN KEY ("finishedItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRecipe" ADD CONSTRAINT "ItemRecipe_ingredientItemId_fkey" FOREIGN KEY ("ingredientItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenStock" ADD CONSTRAINT "KitchenStock_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTransfer" ADD CONSTRAINT "KitchenTransfer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTransfer" ADD CONSTRAINT "KitchenTransfer_transferredById_fkey" FOREIGN KEY ("transferredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_soldById_fkey" FOREIGN KEY ("soldById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
