import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    toggleVideoVisibility,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import checkValidObjectId from '../middlewares/validateObjectId.middleware.js';
import { cache, invalidateCache } from '../middlewares/cache.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { publishVideoSchema, updateVideoSchema, getAllVideosQuerySchema } from '../validators/video.validator.js';

const clearVideosCache = (req, res, next) => {
    res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            await invalidateCache('videos:*');
            await invalidateCache('feed:*');
        }
    });
    next();
};

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Get all videos
 *     description: Returns a paginated list of videos with optional filtering by query, userId, and sorting.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of videos per page
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for video title or description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, views, duration, title]
 *         description: Field to sort by
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter videos by owner user ID
 *     responses:
 *       200:
 *         description: Videos fetched successfully
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
 *                         docs:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Video'
 *                         totalDocs:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   post:
 *     summary: Publish a new video
 *     description: Uploads and publishes a new video with a thumbnail. Requires video file and thumbnail.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - videoFile
 *               - thumbnail
 *               - title
 *               - description
 *             properties:
 *               videoFile:
 *                 type: string
 *                 format: binary
 *                 description: Video file to upload
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Thumbnail image for the video
 *               title:
 *                 type: string
 *                 description: Video title
 *               description:
 *                 type: string
 *                 description: Video description
 *     responses:
 *       201:
 *         description: Video published successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Video'
 *       400:
 *         description: Missing required fields or files
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router
    .route("/")
    .get(validate(getAllVideosQuerySchema, 'query'), cache((req) => `videos:all:${JSON.stringify(req.query)}`, 300), getAllVideos)
    .post(
        clearVideosCache,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        validate(publishVideoSchema),
        publishAVideo
    );

/**
 * @swagger
 * /videos/{videoId}:
 *   get:
 *     summary: Get video by ID
 *     description: Returns a single video by its ID and increments the view count.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the video
 *     responses:
 *       200:
 *         description: Video fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Video'
 *       400:
 *         description: Invalid video ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Delete a video
 *     description: Deletes a video by its ID. Only the video owner can delete it.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the video
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid video ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not authorized to delete this video
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   patch:
 *     summary: Update video details
 *     description: Updates video title, description, and/or thumbnail. Only the video owner can update it.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the video
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated video title
 *               description:
 *                 type: string
 *                 description: Updated video description
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Updated thumbnail image
 *     responses:
 *       200:
 *         description: Video updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Video'
 *       400:
 *         description: Invalid video ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Not authorized to update this video
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router
    .route("/:videoId")
    .get(checkValidObjectId(["videoId"]), cache((req) => `videos:id:${req.params.videoId}`, 300), getVideoById)
    .delete(checkValidObjectId(["videoId"]), clearVideosCache, deleteVideo)
    .patch(checkValidObjectId(["videoId"]), clearVideosCache, upload.single("thumbnail"), validate(updateVideoSchema), updateVideo);

/**
 * @swagger
 * /videos/toggle/visibility/{videoId}:
 *   patch:
 *     summary: Toggle video visibility
 *     description: Updates the visibility status of a video (public, private, unlisted). Only the video owner can toggle it.
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the video
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visibility
 *             properties:
 *               visibility:
 *                 type: string
 *                 enum: [public, private, unlisted]
 *                 description: The new visibility status
 *     responses:
 *       200:
 *         description: Video visibility toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid video ID or visibility status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/toggle/visibility/:videoId").patch(checkValidObjectId(["videoId"]), clearVideosCache, toggleVideoVisibility);

export default router