import multer from "multer";
import path from "path";
import { ApiError } from "../utils/ApiError.js";

/*
========================================
SUPPORTED MIME TYPES
========================================
*/

const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

/*
========================================
MULTER STORAGE CONFIG
========================================
*/

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const extension = path.extname(
      file.originalname
    );

    cb(null, `${uniqueSuffix}${extension}`)
  }
})

/*
========================================
FILE FILTER
========================================
*/

const fileFilter = (
  req,
  file,
  cb
) => {
  if (
    !allowedMimeTypes.includes(file.mimetype)
  ) {
    return cb(
      new ApiError(
        400,
        "Unsupported file type. Only PDF, DOCX, and TXT files are allowed."
      ),
      false
    );
  }

  cb(null, true);
};

/*
========================================
UPLOAD MIDDLEWARE
========================================
*/

const documentUploadMiddleware =
  multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
});

export { documentUploadMiddleware };
