import { v2 as cloudinary } from "cloudinary";
import { env } from "../configs/env.js";
import fs from "fs";

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
})

/*
========================================
UPLOAD FILE TO CLOUDINARY
========================================
*/

const uploadFileToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }

        /*
        ========================================
        UPLOAD FILE
        ========================================
        */

        const response = await cloudinary.uploader.upload(
                localFilePath,
                {
                    resource_type: "raw",
                    folder: "documind/documents",
                    access_mode: "public",
                }
            );

        /*
       ========================================
       DELETE LOCAL TEMP FILE
       ========================================
       */

        fs.unlinkSync(localFilePath);

        return response;

    }catch(error) {
        /*
        ========================================
        DELETE TEMP FILE ON FAILURE
        ========================================
        */
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        
        throw error;
    }
}

/*
========================================
DELETE FILE FROM CLOUDINARY
========================================
*/
    
const deleteFileFromCloudinary = async (publicId) => {
    if (!publicId) {
        return null;
    }
    return await cloudinary.uploader.destroy(
        publicId,
        {
            resource_type: "raw",
        }
    );
}

export {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
};