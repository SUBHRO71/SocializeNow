import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { getFeed } from '../controllers/feed.controller.js';

const router = Router();
router.use(verifyJWT);

/**
 * @swagger
 * /feed:
 *   get:
 *     summary: Get personalized feed
 *     description: Returns videos and tweets from channels the user is subscribed to
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, videos, tweets]
 *           default: all
 *     responses:
 *       200:
 *         description: Feed fetched successfully
 */
router.route('/').get(getFeed);

export default router;
