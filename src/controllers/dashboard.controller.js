import { db } from "../db/db.js";
import { videos, designs } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const videoStatsResult = await db.select({
        totalVideos: sql`count(*)`.mapWith(Number),
        totalVideoViews: sql`sum(${videos.views})`.mapWith(Number),
    })
    .from(videos)
    .where(eq(videos.ownerId, userId));

    const designStatsResult = await db.select({
        totalDesigns: sql`count(*)`.mapWith(Number),
        totalDesignViews: sql`sum(${designs.views})`.mapWith(Number),
    })
    .from(designs)
    .where(eq(designs.ownerId, userId));

    const videoStats = videoStatsResult[0];
    const designStats = designStatsResult[0];

    const stats = {
        totalVideos: videoStats.totalVideos || 0,
        totalVideoViews: videoStats.totalVideoViews || 0,
        totalDesigns: designStats.totalDesigns || 0,
        totalDesignViews: designStats.totalDesignViews || 0,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Dashboard stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const fetchedVideos = await db.select()
        .from(videos)
        .where(eq(videos.ownerId, userId))
        .orderBy(sql`${videos.createdAt} DESC`)
        .limit(parseInt(limit))
        .offset(offset);

    return res
        .status(200)
        .json(new ApiResponse(200, fetchedVideos, "Dashboard videos fetched successfully"));
});

export {
    getChannelStats,
    getChannelVideos
};