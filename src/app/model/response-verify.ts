import { ErrorMap } from "./error-map";

export interface ResponseVerify{
    status: number;
    message: string;
    body: string | ErrorMap;
}
