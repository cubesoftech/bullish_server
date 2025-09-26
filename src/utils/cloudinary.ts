import { v2 as cloudinary } from 'cloudinary';
import { getEnvirontmentVariable } from '.';

cloudinary.config({
    cloud_name: getEnvirontmentVariable("CLOUDINARY_CLOUD_NAME"),
    api_key: getEnvirontmentVariable("CLOUDINARY_API_KEY"),
    api_secret: getEnvirontmentVariable("CLOUDINARY_API_SECRET")
})

export default cloudinary;
