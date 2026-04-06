import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream((error, result) => {
            if (error) {
                return reject(error);
            }

            return resolve(result);
        }).end(buffer);
    });
};