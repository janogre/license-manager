/**
 * Seed script to populate contract types with default values
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedContractTypes() {
  console.log('Seeding contract types...')

  try {
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
      const existingType = await prisma.contractTypeManagement.findUnique({
        where: { name: contractType.name }
      })

      if (!existingType) {
        await prisma.contractTypeManagement.create({
          data: contractType
        })
        console.log(`✓ Created contract type: ${contractType.name}`)
      } else {
        console.log(`- Contract type already exists: ${contractType.name}`)
      }
    }

    console.log('✓ Contract types seeding completed!')

  } catch (error) {
    console.error('Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run seeding
seedContractTypes()
  .catch((error) => {
    console.error('Seeding script failed:', error)
    process.exit(1)
  })