import request from 'supertest';
import { app } from '../src/app.js';

describe('Healthcheck API', () => {
    it('should return a 200 OK status', async () => {
        const response = await request(app).get('/api/v1/healthcheck');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("OK");
    });
});
