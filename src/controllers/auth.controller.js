import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {registerUser,loginUser,refreshAccessToken,logoutUser} from "../services/auth.service.js";
import {accessTokenCookieOptions,refreshTokenCookieOptions,} from "../constants/cookieOptions.js";


/*
========================================
REGISTER USER CONTROLLER
========================================
*/

const registerUserController = asyncHandler(async (req, res) => {
    const user = await registerUser(req.body);
    return res.status(201).json(
      new ApiResponse(
        201,
        user,
        "User registered successfully"
      )
    );
});

/*
========================================
LOGIN USER CONTROLLER
========================================
*/

const loginUserController = asyncHandler(async (req,res) =>{
    const {user,accessToken,refreshToken} = await loginUser(req.body);
    /*
    ========================================
    SET REFRESH TOKEN COOKIE
    ========================================
    */

    res.cookie(
      "refreshToken",
      refreshToken,
      refreshTokenCookieOptions
    );

    /*
    ========================================
    RESPONSE
    ========================================
    */

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user,
          accessToken,
        },
        "Login successful"
      )
    );
})

/*
========================================
REFRESH ACCESS TOKEN CONTROLLER
========================================
*/

const refreshAccessTokenController = asyncHandler(async (req, res) => {
    /*
    ========================================
    EXTRACT REFRESH TOKEN
    ========================================
    */

    const incomingRefreshToken =
      req.cookies?.refreshToken;
    
    /*
    ========================================
    REFRESH TOKENS
    ========================================
    */

    const {
      accessToken,
      refreshToken,
    } = await refreshAccessToken(
      incomingRefreshToken
    );

    /*
    ========================================
    ROTATE REFRESH TOKEN COOKIE
    ========================================
    */

    res.cookie(
      "refreshToken",
      refreshToken,
      refreshTokenCookieOptions
    );

    /*
    ========================================
    RESPONSE
    ========================================
    */

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          accessToken,
        },
        "Access token refreshed successfully"
      )
    );
});

/*
========================================
LOGOUT USER CONTROLLER
========================================
*/

const logoutUserController =
  asyncHandler(async (req, res) => {
    await logoutUser(req.user._id);

    /*
    ========================================
    CLEAR COOKIES
    ========================================
    */

    res.clearCookie(
      "refreshToken",
      refreshTokenCookieOptions
    );

    res.clearCookie(
      "accessToken",
      accessTokenCookieOptions
    );

    /*
    ========================================
    RESPONSE
    ========================================
    */

    return res.status(200).json(
      new ApiResponse(
        200,
        {},
        "Logout successful"
      )
    );
  });

/*
========================================
GET CURRENT USER CONTROLLER
========================================
*/

const getCurrentUserController =
  asyncHandler(async (req, res) => {
    return res.status(200).json(
      new ApiResponse(
        200,
        req.user,
        "Current user fetched successfully"
      )
    );
});

export {
  registerUserController,
  loginUserController,
  refreshAccessTokenController,
  logoutUserController,
  getCurrentUserController
};
