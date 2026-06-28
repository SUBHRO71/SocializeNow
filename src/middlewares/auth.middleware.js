import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { db } from "../db/db.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import config from "../config/index.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
    
        const decodedToken = jwt.verify(token, config.accessTokenSecret);
    
        const existingUsers = await db.select().from(users).where(eq(users.id, decodedToken?._id));
    
        if (!existingUsers.length) {
            throw new ApiError(401, "Invalid Access Token");
        }
    
        const user = { ...existingUsers[0] };
        delete user.password;
        delete user.refreshToken;

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});