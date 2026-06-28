import { ApiError } from "../utils/ApiError.js";

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const checkValidObjectId = (givenObjectIds) => (req, _ , next) => {
    const invalidParam = givenObjectIds.find(id => {
        const val = req.params[id];
        return val && !uuidRegex.test(val);
    });
    
    if (invalidParam) {
        throw new ApiError(400, `Invalid UUID format for parameter: ${invalidParam}`);
    }

    next();
};

export default checkValidObjectId;