import { AuthPayload } from "../../utils/interface";
import "express-serve-static-core";
import { File } from "multer"

export { };

declare module "express-serve-static-core" {
    export interface Request {
        user?: AuthPayload;
    }
}