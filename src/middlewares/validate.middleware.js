import { ApiError } from "../utils/ApiError.js";
import { ZodError } from "zod";

/*
========================================
VALIDATE REQUEST
========================================
*/

const validate = (
  schema,
  source = "body"
) => {

  return (req, res, next) => {
    try {
      /*
      ========================================
      VALIDATE DATA
      ========================================
      */

      const validatedData =
        schema.parse(req[source]);

      /*
      ========================================
      REPLACE REQUEST DATA
      ========================================
      */

      req[source] = validatedData;

      next();
    } catch (error) {
      /*
      ========================================
      HANDLE ZOD ERRORS
      ========================================
      */
      if (error instanceof ZodError) {
        const validationErrors = error.issues.map((issue) => issue.message);
        return next(new ApiError(400, "Validation failed", validationErrors));
      }
      return next(error); 


    }
  };
}

export { validate };