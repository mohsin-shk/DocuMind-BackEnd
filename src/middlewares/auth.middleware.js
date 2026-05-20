import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../configs/env.js";

/*
========================================
REQUIRE AUTH MIDDLEWARE
========================================
*/

const requireAuth = asyncHandler(
    async (req,res,next)=>{
    /*
    ========================================
    EXTRACT ACCESS TOKEN
    ========================================
    */
    const authorizationHeader = req.header("Authorization");
    let accessToken;

    /*
    ========================================
    HEADER TOKEN
    ========================================
    */

    if (
      authorizationHeader?.startsWith(
        "Bearer "
      )
    ) {
      accessToken =
        authorizationHeader.split(" ")[1];
    }

    /*
    ========================================
    COOKIE FALLBACK
    ========================================
    */

    if (!accessToken) {
      accessToken =
        req.cookies?.accessToken;
    }

    /*
    ========================================
    TOKEN REQUIRED
    ========================================
    */

    if (!accessToken) {
      throw new ApiError(
        401,
        "Unauthorized access"
      );
    }

     /*
    ========================================
    VERIFY JWT
    ========================================
    */
    
    let decodedToken;

    try {
      decodedToken = jwt.verify(
        accessToken,
        env.ACCESS_TOKEN_SECRET
      );
    } catch (error) {
      throw new ApiError(
        401,
        "Unauthorized access"
      );
    }

    /*
    ========================================
    FIND USER
    ========================================
    */

     const user = await User.findById(
      decodedToken?._id
    );

    if (!user) {
      throw new ApiError(
        401,
        "Unauthorized access"
      );
    }
    
    /*
    ========================================
    ACCOUNT STATUS CHECK
    ========================================
    */
     
    if (
      user.accountStatus === "suspended"
    ) {
      throw new ApiError(
        403,
        "Account is suspended"
      );
    }

    if (
      user.accountStatus ===
      "deactivated"
    ) {
      throw new ApiError(
        403,
        "Account is deactivated"
      );
    }

    /*
    ========================================
    ATTACH USER TO REQUEST
    ========================================
    */

    req.user = user.toObject();

    /*
    ========================================
    CONTINUE REQUEST
    ========================================
    */

    next();

    }
)

export { requireAuth };