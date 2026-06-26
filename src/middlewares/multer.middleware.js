import multer from "multer";
import crypto from "crypto";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const uniqueName = `${crypto.randomUUID()}${ext}`;
      cb(null, uniqueName)
    }
  })
  
export const upload = multer({ 
    storage, 
    limits:{fileSize: 20000 * 1024 * 1024}  //20GB limit
})