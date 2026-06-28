import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SocializeNow API',
      version: '1.0.0',
      description: 'A scalable AI-powered media and social backend platform for portfolios',
      contact: {
        name: 'Subhrojyoti Das',
      },
    },
    servers: [
      {
        url: 'http://localhost:{port}/api/v1',
        description: 'Development server',
        variables: {
          port: {
            default: '8000',
          },
        },
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            data: { type: 'object' },
            message: { type: 'string' },
            success: { type: 'boolean' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            success: { type: 'boolean', default: false },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            fullName: { type: 'string' },
            avatar: { type: 'string', format: 'uri' },
            coverImage: { type: 'string', format: 'uri' },
            portfolioSlug: { type: 'string' },
            portfolioVisibility: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Video: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            rawVideoUrl: { type: 'string', format: 'uri' },
            thumbnail: { type: 'string', format: 'uri' },
            duration: { type: 'number' },
            views: { type: 'integer' },
            visibility: { type: 'string', enum: ['public', 'private', 'unlisted'] },
            ownerId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Design: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            images: { type: 'array', items: { type: 'string', format: 'uri' } },
            toolsUsed: { type: 'array', items: { type: 'string' } },
            views: { type: 'integer' },
            visibility: { type: 'string', enum: ['public', 'private', 'unlisted'] },
            ownerId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Users', description: 'User authentication and profile management' },
      { name: 'Videos', description: 'Video upload, management, and discovery' },
      { name: 'Designs', description: 'Design portfolio upload and management' },
      { name: 'Dashboard', description: 'Creator dashboard and analytics' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
