-- CreateIndex
CREATE INDEX "Service_providerId_idx" ON "Service"("providerId");

-- CreateIndex
CREATE INDEX "Service_categoryId_idx" ON "Service"("categoryId");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE INDEX "Service_price_idx" ON "Service"("price");

-- CreateIndex
CREATE INDEX "Service_createdAt_idx" ON "Service"("createdAt");

-- CreateIndex
CREATE INDEX "ServiceProvider_userId_idx" ON "ServiceProvider"("userId");

-- CreateIndex
CREATE INDEX "ServiceProvider_isVerified_idx" ON "ServiceProvider"("isVerified");

-- CreateIndex
CREATE INDEX "ServiceProvider_averageRating_idx" ON "ServiceProvider"("averageRating");

-- CreateIndex
CREATE INDEX "ServiceProvider_createdAt_idx" ON "ServiceProvider"("createdAt");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
