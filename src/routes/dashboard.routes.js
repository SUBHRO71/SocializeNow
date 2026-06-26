import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { cache } from '../middlewares/cache.middleware.js';

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get channel stats
 *     description: Returns channel statistics for the authenticated user including total views, subscribers, videos, and likes.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Channel stats fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalViews:
 *                           type: integer
 *                         totalSubscribers:
 *                           type: integer
 *                         totalVideos:
 *                           type: integer
 *                         totalLikes:
 *                           type: integer
 *       401:
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/stats").get(cache((req) => `dashboard:stats:${req.user._id}`, 300), getChannelStats);

/**
 * @swagger
 * /dashboard/videos:
 *   get:
 *     summary: Get channel videos
 *     description: Returns all videos uploaded by the authenticated user for dashboard management.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Channel videos fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Video'
 *       401:
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/videos").get(cache((req) => `dashboard:videos:${req.user._id}`, 300), getChannelVideos);

export default router