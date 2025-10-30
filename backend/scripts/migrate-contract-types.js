/**
 * Migration script to convert contract types from enum to dynamic table
 * This script should be run once to migrate existing data
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateContractTypes() {
  console.log('Starting contract types migration...')

  try {
    // Step 1: Create contract types table and seed with default values
    console.log('Step 1: Creating default contract types...')
    
    const defaultContractTypes = [
      {
        name: 'Juniper Care',
        description: 'Standard Juniper support and maintenance',
        isDefault: true,
        isActive: true
      },
      {
        name: 'Premium Care',
        description: 'Premium Juniper support with enhanced SLA',
        isDefault: false,
        isActive: true
      },
      {
        name: 'Third Party',
        description: 'Third-party maintenance and support',
        isDefault: false,
        isActive: true
      },
      {
        name: 'Other',
        description: 'Other types of maintenance contracts',
        isDefault: false,
        isActive: true
      }
    ]

    // Insert contract types
    for (const contractType of defaultContractTypes) {
      await prisma.$executeRaw`
        INSERT INTO contract_types (id, name, description, "isDefault", "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${contractType.name}, ${contractType.description}, ${contractType.isDefault}, ${contractType.isActive}, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `
    }

    console.log('✓ Contract types created')

    // Step 2: Get the created contract type IDs
    const contractTypes = await prisma.$queryRaw`SELECT id, name FROM contract_types`
    const contractTypeMap = {}
    contractTypes.forEach(ct => {
      // Map old enum values to new names
      if (ct.name === 'Juniper Care') contractTypeMap['JUNIPER_CARE'] = ct.id
      if (ct.name === 'Premium Care') contractTypeMap['PREMIUM_CARE'] = ct.id  
      if (ct.name === 'Third Party') contractTypeMap['THIRD_PARTY'] = ct.id
      if (ct.name === 'Other') contractTypeMap['OTHER'] = ct.id
    })

    console.log('Step 2: Contract type mapping created:', contractTypeMap)

    // Step 3: Add new contractTypeId column (nullable first)
    console.log('Step 3: Adding contractTypeId column...')
    await prisma.$executeRaw`ALTER TABLE maintenance_contracts ADD COLUMN "contractTypeId" TEXT`

    // Step 4: Update existing contracts with new IDs
    console.log('Step 4: Updating existing contracts...')
    
    for (const [oldType, newId] of Object.entries(contractTypeMap)) {
      await prisma.$executeRaw`
        UPDATE maintenance_contracts 
        SET "contractTypeId" = ${newId}
        WHERE "contractType" = ${oldType}
      `
    }

    // Step 5: Make contractTypeId required and add foreign key
    console.log('Step 5: Making contractTypeId required...')
    await prisma.$executeRaw`ALTER TABLE maintenance_contracts ALTER COLUMN "contractTypeId" SET NOT NULL`
    
    // Add foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE maintenance_contracts 
      ADD CONSTRAINT "maintenance_contracts_contractTypeId_fkey" 
      FOREIGN KEY ("contractTypeId") REFERENCES contract_types("id") ON DELETE RESTRICT ON UPDATE CASCADE
    `

    // Add index
    await prisma.$executeRaw`CREATE INDEX "maintenance_contracts_contractTypeId_idx" ON maintenance_contracts("contractTypeId")`

    // Step 6: Drop old contractType column
    console.log('Step 6: Removing old contractType column...')
    await prisma.$executeRaw`ALTER TABLE maintenance_contracts DROP COLUMN "contractType"`

    console.log('✓ Contract types migration completed successfully!')

  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateContractTypes()
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })