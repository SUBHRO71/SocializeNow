import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/index.js";

export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

export const isPasswordCorrect = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            _id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName
        },
        config.accessTokenSecret,
        {
            expiresIn: config.accessTokenExpiry
        }
    );
};

export const generateRefreshToken = (userId) => {
    return jwt.sign(
        {
            _id: userId,
        },
        config.refreshTokenSecret,
        {
            expiresIn: config.refreshTokenExpiry
        }
    );
};
