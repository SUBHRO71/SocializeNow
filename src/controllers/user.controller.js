import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { db } from "../db/db.js";
import { users } from "../db/schema.js";
import { eq, or } from "drizzle-orm";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import deleteFromCloudinary from "../utils/deleteFromCloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { hashPassword, isPasswordCorrect, generateAccessToken, generateRefreshToken } from "../utils/auth.js";
import jwt from "jsonwebtoken";
import config from "../config/index.js";

const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await db.select().from(users).where(eq(users.id, userId));
        if (!user.length) throw new Error("User not found");
        
        const accessToken = generateAccessToken(user[0]);
        const refreshToken = generateRefreshToken(user[0].id);

        await db.update(users).set({ refreshToken }).where(eq(users.id, userId));

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if ([fullName, email, username, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await db.select().from(users).where(
        or(eq(users.username, username.toLowerCase()), eq(users.email, email.toLowerCase()))
    );

    if (existedUser.length > 0) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    const hashedPassword = await hashPassword(password);

    const createdUsers = await db.insert(users).values({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || null,
        email: email.toLowerCase(),
        password: hashedPassword,
        username: username.toLowerCase()
    }).returning({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
        coverImage: users.coverImage,
        portfolioSlug: users.portfolioSlug,
        portfolioVisibility: users.portfolioVisibility,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
    });

    if (!createdUsers.length) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUsers[0], "User registered Successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email is required");
    }
    if (!password) {
        throw new ApiError(400, "password is required");
    }

    const userQuery = username ? eq(users.username, username.toLowerCase()) : eq(users.email, email.toLowerCase());
    const existingUsers = await db.select().from(users).where(userQuery);

    if (!existingUsers.length) {
        throw new ApiError(404, "User does not exist");
    }
    const user = existingUsers[0];

    const isPasswordValid = await isPasswordCorrect(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user.id);

    const loggedInUser = { ...user };
    delete loggedInUser.password;
    delete loggedInUser.refreshToken;

    const options = {
        httpOnly: true,
        secure: config.isProd
    };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged In Successfully")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
    await db.update(users).set({ refreshToken: null }).where(eq(users.id, req.user.id));

    const options = {
        httpOnly: true,
        secure: config.isProd
    };

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, config.refreshTokenSecret);
        
        const existingUsers = await db.select().from(users).where(eq(users.id, decodedToken._id));
        if (!existingUsers.length) {
            throw new ApiError(401, "Invalid refresh token");
        }
        const user = existingUsers[0];

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: config.isProd
        };

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user.id);

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed")
        );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const { oldPassword, newPassword } = req.body;

    const existingUsers = await db.select().from(users).where(eq(users.id, req.user.id));
    const user = existingUsers[0];

    const isPassCorrect = await isPasswordCorrect(oldPassword, user.password);
    if (!isPassCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    const newHashedPassword = await hashPassword(newPassword);
    await db.update(users).set({ password: newHashedPassword }).where(eq(users.id, user.id));

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async(req, res) => {
    const { fullName, email } = req.body;

    if (!fullName && !email) {
        throw new ApiError(400, "Any One feild (email or fullName) is required.");
    }
    
    if (email) {
        const existingEmail = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
        if (existingEmail.length && existingEmail[0].id !== req.user.id) {
            throw new ApiError(409, "User with this email already exists.");
        }
    }

    const updatedUsers = await db.update(users).set({
        fullName: fullName || req.user.fullName,
        email: email ? email.toLowerCase() : req.user.email
    }).where(eq(users.id, req.user.id)).returning({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
        coverImage: users.coverImage,
        portfolioSlug: users.portfolioSlug,
        portfolioVisibility: users.portfolioVisibility,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
    });

    return res.status(200).json(new ApiResponse(200, updatedUsers[0], "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const currentUser = await db.select({ avatar: users.avatar }).from(users).where(eq(users.id, req.user.id));
    const oldAvatarUrl = currentUser[0]?.avatar;

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const updatedUsers = await db.update(users).set({ avatar: avatar.url }).where(eq(users.id, req.user.id)).returning({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
        coverImage: users.coverImage,
        portfolioSlug: users.portfolioSlug,
        portfolioVisibility: users.portfolioVisibility,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
    });

    if (oldAvatarUrl) {
        const publicId = oldAvatarUrl.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId, "image");
    }

    return res.status(200).json(new ApiResponse(200, updatedUsers[0], "Avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    const currentUser = await db.select({ coverImage: users.coverImage }).from(users).where(eq(users.id, req.user.id));
    const oldCoverImageUrl = currentUser[0]?.coverImage;

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage?.url) {
        throw new ApiError(400, "Error while uploading cover image");
    }

    const updatedUsers = await db.update(users).set({ coverImage: coverImage.url }).where(eq(users.id, req.user.id)).returning({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
        coverImage: users.coverImage,
        portfolioSlug: users.portfolioSlug,
        portfolioVisibility: users.portfolioVisibility,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
    });

    if (oldCoverImageUrl) {
        const publicId = oldCoverImageUrl.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId, "image");
    }

    return res.status(200).json(new ApiResponse(200, updatedUsers[0], "Cover image updated successfully"));
});

const updatePortfolioSettings = asyncHandler(async(req, res) => {
    const { portfolioSlug, portfolioVisibility } = req.body;

    if (portfolioSlug) {
        const existingSlug = await db.select().from(users).where(eq(users.portfolioSlug, portfolioSlug));
        if (existingSlug.length && existingSlug[0].id !== req.user.id) {
            throw new ApiError(409, "Portfolio slug already taken");
        }
    }

    const updatedUsers = await db.update(users).set({
        portfolioSlug: portfolioSlug || req.user.portfolioSlug,
        portfolioVisibility: portfolioVisibility || req.user.portfolioVisibility
    }).where(eq(users.id, req.user.id)).returning({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
        coverImage: users.coverImage,
        portfolioSlug: users.portfolioSlug,
        portfolioVisibility: users.portfolioVisibility,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
    });

    return res.status(200).json(new ApiResponse(200, updatedUsers[0], "Portfolio settings updated successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    updatePortfolioSettings
}
