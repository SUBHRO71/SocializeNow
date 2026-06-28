import { Router } from 'express';
import {
    deleteDesign,
    getAllDesigns,
    getDesignById,
    publishDesign,
    toggleDesignVisibility
} from "../controllers/design.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import checkValidObjectId from '../middlewares/validateObjectId.middleware.js';

const router = Router();
router.use(verifyJWT);

router.route("/")
    .get(getAllDesigns)
    .post(
        upload.fields([{ name: "images", maxCount: 10 }]),
        publishDesign
    );

router.route("/:designId")
    .get(checkValidObjectId(["designId"]), getDesignById)
    .delete(checkValidObjectId(["designId"]), deleteDesign);

router.route("/toggle/visibility/:designId").patch(checkValidObjectId(["designId"]), toggleDesignVisibility);

export default router;
