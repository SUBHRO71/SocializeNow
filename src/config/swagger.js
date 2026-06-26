import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SocializeNow API',
      version: '1.0.0',
      description: 'A scalable AI-powered media and social backend platform inspired by YouTube and Twitter/X',
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
            _id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            fullName: { type: 'string' },
            avatar: { type: 'string', format: 'uri' },
            coverImage: { type: 'string', format: 'uri' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Video: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            videoFile: { type: 'object', properties: { url: { type: 'string' }, public_id: { type: 'string' } } },
            thumbnail: { type: 'object', properties: { url: { type: 'string' }, public_id: { type: 'string' } } },
            title: { type: 'string' },
            description: { type: 'string' },
            duration: { type: 'number' },
            views: { type: 'integer' },
            isPublished: { type: 'boolean' },
            owner: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Tweet: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            content: { type: 'string' },
            owner: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            content: { type: 'string' },
            video: { type: 'string' },
            owner: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Users', description: 'User authentication and profile management' },
      { name: 'Videos', description: 'Video upload, management, and discovery' },
      { name: 'Comments', description: 'Video comments' },
      { name: 'Likes', description: 'Like/unlike content' },
      { name: 'Playlists', description: 'Playlist management' },
      { name: 'Subscriptions', description: 'Channel subscriptions' },
      { name: 'Tweets', description: 'Short text posts' },
      { name: 'Dashboard', description: 'Creator dashboard and analytics' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
