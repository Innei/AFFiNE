-- CreateTable
CREATE TABLE "licenses" (
    "key" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revealed_at" TIMESTAMPTZ(3),
    "installed_at" TIMESTAMPTZ(3),
    "validate_key" VARCHAR,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "installed_licenses" (
    "key" VARCHAR NOT NULL,
    "workspace_id" VARCHAR NOT NULL,
    "installed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validate_key" VARCHAR,
    "validated_at" TIMESTAMPTZ(3),

    CONSTRAINT "installed_licenses_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "installed_licenses_workspace_id_key" ON "installed_licenses"("workspace_id");
