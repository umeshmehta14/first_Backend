import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFile) => {
  try {
    if (!localFile) return null;
    // upload on cloudinary
    const response = await cloudinary.uploader.upload(localFile, {
      resource_type: "auto",
    });
    // file has been successfully uploaded
    console.log("file has been successfully uploaded ", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFile);
    // remove the locally saved temporary file as the upload opeartion got failed
    return null;
  }
};

export { uploadOnCloudinary };