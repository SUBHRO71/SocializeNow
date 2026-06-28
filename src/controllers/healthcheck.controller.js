import { db } from "../db/db.js";
import { sql } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    try {
        await db.execute(sql`SELECT 1`);
        return res
            .status(200)
            .json(new ApiResponse(200, { status: "OK", dbStatus: "connected" }, "Health check passed: System is up and running"));
    } catch (error) {
        throw new ApiError(500, "Database connection not healthy");
    }
});

export {
    healthcheck
};