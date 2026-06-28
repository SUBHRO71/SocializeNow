import { db } from "../db/db.js";
import { designs, users } from "../db/schema.js";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllDesigns = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let filters = [];
    if (!userId || userId !== req.user?.id) {
        filters.push(eq(designs.visibility, 'public'));
    }
    
    if (userId) {
        filters.push(eq(designs.ownerId, userId));
    }
    
    if (query) {
        filters.push(
            or(
                ilike(designs.title, `%${query}%`),
                ilike(designs.description, `%${query}%`)
            )
        );
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    
    const orderClause = sortType === "asc" ? sql`${designs[sortBy]} ASC` : sql`${designs[sortBy]} DESC`;

    const fetchedDesigns = await db.select({
        id: designs.id,
        title: designs.title,
        description: designs.description,
        images: designs.images,
        toolsUsed: designs.toolsUsed,
        visibility: designs.visibility,
        views: designs.views,
        createdAt: designs.createdAt,
        owner: {
            id: users.id,
            username: users.username,
            avatar: users.avatar
        }
    })
    .from(designs)
    .innerJoin(users, eq(designs.ownerId, users.id))
    .where(whereClause)
    .limit(parseInt(limit))
    .offset(offset)
    .orderBy(orderClause);

    return res.status(200).json(new ApiResponse(200, fetchedDesigns, "Successfully fetched designs"));
});

const publishDesign = asyncHandler(async (req, res) => {
    const { title, description, toolsUsed } = req.body;

    if ([title].some((field) => !field?.trim())) {
        throw new ApiError(400, "Title is required.");
    }

    const imageFilesLocalPaths = req.files?.images?.map(f => f.path);

    if (!imageFilesLocalPaths || imageFilesLocalPaths.length === 0) {
        throw new ApiError(400, "At least one design image is required.");
    }

    const uploadedImages = [];
    for (const path of imageFilesLocalPaths) {
        const upload = await uploadOnCloudinary(path);
        if (upload?.url) {
            uploadedImages.push(upload.url);
        }
    }

    if (uploadedImages.length === 0) {
        throw new ApiError(500, "Upload to cloudinary failed.");
    }

    let parsedTools = [];
    if (toolsUsed) {
        try {
            parsedTools = JSON.parse(toolsUsed);
        } catch(e) {
            parsedTools = toolsUsed.split(',').map(t => t.trim());
        }
    }

    const newDesign = await db.insert(designs).values({
        ownerId: req.user.id,
        title: title.trim(),
        description: description?.trim() || "",
        images: uploadedImages,
        toolsUsed: parsedTools,
        visibility: 'public',
    }).returning();

    return res.status(201).json(new ApiResponse(201, newDesign[0], "Successfully published design"));
});

const getDesignById = asyncHandler(async (req, res) => {
    const { designId } = req.params;

    if (req.user?.id) {
        await db.update(designs).set({ views: sql`${designs.views} + 1` }).where(eq(designs.id, designId));
    }

    const designResult = await db.select({
        id: designs.id,
        title: designs.title,
        description: designs.description,
        images: designs.images,
        toolsUsed: designs.toolsUsed,
        visibility: designs.visibility,
        views: designs.views,
        createdAt: designs.createdAt,
        owner: {
            id: users.id,
            username: users.username,
            avatar: users.avatar,
            fullName: users.fullName
        }
    })
    .from(designs)
    .innerJoin(users, eq(designs.ownerId, users.id))
    .where(eq(designs.id, designId));

    if (!designResult.length) {
        throw new ApiError(404, "Design doesn't exist");
    }

    return res.status(200).json(new ApiResponse(200, designResult[0], "successfully fetched design details"));
});

const deleteDesign = asyncHandler(async (req, res) => {
    const { designId } = req.params;
    const userId = req.user.id;

    const deletedDesign = await db.delete(designs).where(and(eq(designs.id, designId), eq(designs.ownerId, userId))).returning();

    if (!deletedDesign.length) {
        throw new ApiError(404, "Design not found or unauthorized");
    }

    return res.status(200).json(new ApiResponse(200, null, "Successfully deleted design"));
});

const toggleDesignVisibility = asyncHandler(async (req, res) => {
    const { designId } = req.params;
    const userId = req.user.id;
    const { visibility } = req.body; // 'public' | 'private' | 'unlisted'

    if (!['public', 'private', 'unlisted'].includes(visibility)) {
        throw new ApiError(400, "Invalid visibility status");
    }

    const existingDesigns = await db.select().from(designs).where(and(eq(designs.id, designId), eq(designs.ownerId, userId)));
    if (!existingDesigns.length) {
        throw new ApiError(404, "Design not found or unauthorized");
    }

    const updatedDesign = await db.update(designs).set({ visibility }).where(eq(designs.id, designId)).returning();

    return res.status(200).json(new ApiResponse(200, updatedDesign[0], "Successfully updated design visibility"));
});

export {
    getAllDesigns,
    publishDesign,
    getDesignById,
    deleteDesign,
    toggleDesignVisibility
};
