import { db } from "../db/db.js";
import { videos, users } from "../db/schema.js";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import deleteFromCloudinary from "../utils/deleteFromCloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let filters = [];
    if (!userId || userId !== req.user?.id) {
        filters.push(eq(videos.visibility, 'public'));
    }
    
    if (userId) {
        filters.push(eq(videos.ownerId, userId));
    }
    
    if (query) {
        filters.push(
            or(
                ilike(videos.title, `%${query}%`),
                ilike(videos.description, `%${query}%`)
            )
        );
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    
    const orderClause = sortType === "asc" ? sql`${videos[sortBy]} ASC` : sql`${videos[sortBy]} DESC`;

    const fetchedVideos = await db.select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        thumbnail: videos.thumbnail,
        rawVideoUrl: videos.rawVideoUrl,
        visibility: videos.visibility,
        views: videos.views,
        createdAt: videos.createdAt,
        owner: {
            id: users.id,
            username: users.username,
            avatar: users.avatar
        }
    })
    .from(videos)
    .innerJoin(users, eq(videos.ownerId, users.id))
    .where(whereClause)
    .limit(parseInt(limit))
    .offset(offset)
    .orderBy(orderClause);

    return res.status(200).json(new ApiResponse(200, fetchedVideos, "Successfully fetched videos"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if ([title, description].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required.");
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailFileLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath || !thumbnailFileLocalPath) {
        throw new ApiError(400, "Video file and thumbnail are required.");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnailFile = await uploadOnCloudinary(thumbnailFileLocalPath);

    if (!videoFile?.url || !thumbnailFile?.url) {
        throw new ApiError(500, "Upload to cloudinary failed.");
    }

    try {
        const uploadVideo = await db.insert(videos).values({
            ownerId: req.user.id,
            title: title.trim(),
            description: description.trim(),
            rawVideoUrl: videoFile.url,
            thumbnail: thumbnailFile.url,
            duration: videoFile.duration || 0,
            visibility: 'public',
            resolutionsAvailable: [],
            keyframes: []
        }).returning();

        // FFmpeg background processing trigger will go here (Phase 2)

        return res.status(201).json(new ApiResponse(201, uploadVideo[0], "Successfully uploaded video"));

    } catch (error) {
        throw error;
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (req.user?.id) {
        await db.update(videos).set({ views: sql`${videos.views} + 1` }).where(eq(videos.id, videoId));
    }

    const videoResult = await db.select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        thumbnail: videos.thumbnail,
        rawVideoUrl: videos.rawVideoUrl,
        hlsManifestUrl: videos.hlsManifestUrl,
        isTranscoded: videos.isTranscoded,
        resolutionsAvailable: videos.resolutionsAvailable,
        keyframes: videos.keyframes,
        visibility: videos.visibility,
        views: videos.views,
        createdAt: videos.createdAt,
        owner: {
            id: users.id,
            username: users.username,
            avatar: users.avatar,
            fullName: users.fullName
        }
    })
    .from(videos)
    .innerJoin(users, eq(videos.ownerId, users.id))
    .where(eq(videos.id, videoId));

    if (!videoResult.length) {
        throw new ApiError(404, "Video doesn't exist");
    }

    return res.status(200).json(new ApiResponse(200, videoResult[0], "successfully fetched video details"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!title && !description && !req.file?.path) {
        throw new ApiError(400, "Required at least one field to update");
    }

    const existingVideos = await db.select().from(videos).where(and(eq(videos.id, videoId), eq(videos.ownerId, userId)));
    if (!existingVideos.length) {
        throw new ApiError(404, "Video not found or unauthorized");
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();

    if (req.file?.path) {
        const thumbnailFile = await uploadOnCloudinary(req.file.path);
        if (!thumbnailFile?.url) {
            throw new ApiError(500, "Thumbnail upload failed");
        }
        updateData.thumbnail = thumbnailFile.url;
    }

    const updatedVideo = await db.update(videos).set(updateData).where(eq(videos.id, videoId)).returning();

    return res.status(200).json(new ApiResponse(200, updatedVideo[0], "Successfully updated video details"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user.id;

    const deletedVideo = await db.delete(videos).where(and(eq(videos.id, videoId), eq(videos.ownerId, userId))).returning();

    if (!deletedVideo.length) {
        throw new ApiError(404, "Video not found or unauthorized");
    }

    return res.status(200).json(new ApiResponse(200, null, "Successfully deleted video"));
});

const toggleVideoVisibility = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user.id;
    const { visibility } = req.body; // 'public' | 'private' | 'unlisted'

    if (!['public', 'private', 'unlisted'].includes(visibility)) {
        throw new ApiError(400, "Invalid visibility status");
    }

    const existingVideos = await db.select().from(videos).where(and(eq(videos.id, videoId), eq(videos.ownerId, userId)));
    if (!existingVideos.length) {
        throw new ApiError(404, "Video not found or unauthorized");
    }

    const updatedVideo = await db.update(videos).set({ visibility }).where(eq(videos.id, videoId)).returning();

    return res.status(200).json(new ApiResponse(200, updatedVideo[0], "Successfully updated video visibility"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    toggleVideoVisibility
};
