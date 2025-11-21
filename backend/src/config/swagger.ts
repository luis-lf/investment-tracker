import swaggerJSDoc, { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Investment Tracker API',
      version: '1.0.0',
      description: `
        Investment Tracker API - A comprehensive platform for managing investment portfolios across Brazil and USA with multi-currency support and tax reporting.

        ## Features
        - Multi-currency portfolio management (BRL/USD)
        - Investment tracking with monthly snapshots
        - Tax calculation for Brazilian investments (IR, IOF)
        - Dashboard with analytics and portfolio evolution
        - Exchange rate management with scenarios (Official, Optimistic, Pessimistic)
        - User authentication with JWT

        ## Authentication
        Most endpoints require authentication. To authenticate:
        1. Register a new user via \`POST /api/v1/auth/register\`
        2. Login via \`POST /api/v1/auth/login\` to receive a JWT token
        3. Include the token in the \`Authorization\` header as \`Bearer <token>\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@investmenttracker.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'http://localhost:3001',
        description: 'Local development'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'An error occurred'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              example: 'USER'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                }
              }
            }
          }
        },
        Investment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            country: {
              type: 'string',
              enum: ['BR', 'US'],
              example: 'BR'
            },
            account: {
              type: 'string',
              example: 'Nubank'
            },
            description: {
              type: 'string',
              example: 'Tesouro Selic 2025'
            },
            type: {
              type: 'string',
              example: 'TREASURY'
            },
            codigo: {
              type: 'string',
              example: 'TS-2025'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'DONE', 'SOLD', 'TRANSFERRED'],
              example: 'ACTIVE'
            },
            purchaseDate: {
              type: 'string',
              format: 'date'
            },
            purchaseValueOriginal: {
              type: 'number',
              example: 10000.00
            },
            purchaseCurrency: {
              type: 'string',
              example: 'BRL'
            },
            maturityDate: {
              type: 'string',
              format: 'date'
            }
          }
        },
        Snapshot: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            investmentId: {
              type: 'integer'
            },
            snapshotDate: {
              type: 'string',
              format: 'date'
            },
            valueOriginal: {
              type: 'number'
            },
            currency: {
              type: 'string',
              minLength: 3,
              maxLength: 3
            },
            status: {
              type: 'string'
            }
          }
        },
        ExchangeRate: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            date: {
              type: 'string',
              format: 'date'
            },
            rate: {
              type: 'number',
              example: 5.10
            },
            type: {
              type: 'string',
              enum: ['OFFICIAL', 'PESSIMISTIC', 'OPTIMISTIC'],
              example: 'OFFICIAL'
            },
            source: {
              type: 'string',
              example: 'Banco Central'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and profile management'
      },
      {
        name: 'Investments',
        description: 'Investment portfolio management'
      },
      {
        name: 'Snapshots',
        description: 'Monthly portfolio value snapshots'
      },
      {
        name: 'Exchange Rates',
        description: 'Currency exchange rate management'
      },
      {
        name: 'Dashboard',
        description: 'Dashboard analytics and summaries'
      },
      {
        name: 'Tax',
        description: 'Tax calculations and reports'
      },
      {
        name: 'Import/Export',
        description: 'Data import and export functionality'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './dist/routes/*.js'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);
