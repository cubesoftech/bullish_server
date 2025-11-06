import { AuthPayload } from "../../utils/interface";
import "express-serve-static-core";

export { };

declare module "express-serve-static-core" {
    export interface Request {
        user?: AuthPayload;
    }
}