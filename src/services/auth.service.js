import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import {env} from "../configs/env.js"
/*
========================================
REGISTER USER SERVICE
========================================
*/

const registerUser = async ({
    fullName,
    username,
    email,
    password,
}) => {
    /*
  ========================================
  BASIC VALIDATION
  ========================================
  */

    if (
        !fullName?.trim() ||
        !username?.trim() ||
        !email?.trim() ||
        !password?.trim()
    ) {
        throw new ApiError(
            400,
            "All fields are required"
        );
    }

    /*
   ========================================
   NORMALIZE INPUTS
   ========================================
   */

    const normalizedEmail = email
        .trim()
        .toLowerCase();

    const normalizedUsername = username
        .trim()
        .toLowerCase();

    /*
    ========================================
    PASSWORD STRENGTH VALIDATION
    ========================================
    */
    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#^()_\-+=])[A-Za-z\d@$!%*?&.#^()_\-+=]{8,}$/;

    const isValidPassword =
        passwordRegex.test(password);

    if (!isValidPassword) {
        throw new ApiError(
            400,
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
        );
    }

    /*
    ========================================
    CHECK EXISTING USER
    ========================================
    */

    const existingUser = await User.findOne({
        $or: [
            { email: normalizedEmail },
            { username: normalizedUsername },
        ],
    });

    if (existingUser) {
        if (existingUser.email === normalizedEmail) {
            throw new ApiError(
                409,
                "Email already exists"
            );
        }

        if (
            existingUser.username ===
            normalizedUsername
        ) {
            throw new ApiError(
                409,
                "Username already exists"
            );
        }
    }

    /*
   ========================================
   CREATE USER
   ========================================
   */

    const createdUser = await User.create({
        fullName: fullName.trim(),
        username: normalizedUsername,
        email: normalizedEmail,
        password,
    });

    /*
   ========================================
   FETCH SANITIZED USER
   ========================================
   */

    const user = await User.findById(
        createdUser._id
    ).select(
        "-password -refreshToken -resetPasswordToken -resetPasswordExpiry -emailVerificationToken -emailVerificationExpiry"
    );

    if (!user) {
        throw new ApiError(
            500,
            "Failed to create user"
        );
    }
    return user;
}

/*
========================================
GENERATE ACCESS & REFRESH TOKENS
========================================
*/

const generateAccessAndRefreshTokens = async (userId) => {

    /*
    ========================================
    FIND USER
    ========================================
    */
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    /*
    ========================================
    GENERATE TOKENS
    ========================================
    */

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    /*
    ========================================
    SAVE REFRESH TOKEN
    ========================================
    */

    user.refreshToken = refreshToken;

    await user.save({
        validateBeforeSave: false,
    });

    /*
    ========================================
    RETURN TOKENS
    ========================================
    */

    return {
        accessToken,
        refreshToken,
    };
}

/*
========================================
LOGIN USER SERVICE
========================================
*/

const loginUser = async ({ identifier, password }) => {
    /*
     ========================================
     BASIC VALIDATION
     ========================================
     */

    if (
        !identifier?.trim() ||
        !password?.trim()
    ) {
        throw new ApiError(
            400,
            "Email/Username and password are required"
        );
    }

    /*
    ========================================
    NORMALIZE IDENTIFIER
    ========================================
    */

    const normalizedIdentifier = identifier.trim().toLowerCase();

    /*
    ========================================
    FIND USER
    ========================================
    */
    const user = await User.findOne({
        $or: [
            { email: normalizedIdentifier },
            { username: normalizedIdentifier },
        ],
    }).select("+password +refreshToken");

    /*
    ========================================
    INVALID USER
    ========================================
    */

    if (!user) {
        throw new ApiError(
            401,
            "Invalid credentials"
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
        user.accountStatus === "deactivated"
    ) {
        throw new ApiError(
            403,
            "Account is deactivated"
        );
    }

    /*
   ========================================
   OAUTH-ONLY ACCOUNT CHECK
   ========================================
   */

    if (!user.password) {
        throw new ApiError(
            401,
            "This account uses social login"
        );
    }

    /*
   ========================================
   PASSWORD VALIDATION
   ========================================
   */

    const isPasswordCorrect =
        await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(
            401,
            "Invalid credentials"
        );
    }

    /*
   ========================================
   GENERATE TOKENS
   ========================================
   */

    const {
        accessToken,
        refreshToken,
    } =
        await generateAccessAndRefreshTokens(
            user._id
        );

    /*
 ========================================
 UPDATE LAST LOGIN
 ========================================
 */

    // user.lastLogin = new Date();

    // await user.save({
    //     validateBeforeSave: false,
    // });

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    /*
   ========================================
   SANITIZE USER
   ========================================
   */

    const sanitizedUser =
        user.toObject();

    delete sanitizedUser.password;
    delete sanitizedUser.refreshToken;

    /*
    ========================================
    RETURN AUTH PAYLOAD
    ========================================
    */

    return {
        user: sanitizedUser,
        accessToken,
        refreshToken,
    };
}

const refreshAccessToken = async (incomingRefreshToken) => {
    /*
  ========================================
  CHECK TOKEN EXISTS
  ========================================
  */
    if (!incomingRefreshToken) {
        throw new ApiError(
            401,
            "Invalid or expired refresh token"
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
            incomingRefreshToken,
            env.REFRESH_TOKEN_SECRET
        );
    } catch (error) {
        throw new ApiError(
            401,
            "Invalid or expired refresh token"
        );
    }

    /*
    ========================================
    FIND USER
    ========================================
    */

    const user = await User.findById(
        decodedToken?._id
    ).select("+refreshToken");

    if (!user) {
        throw new ApiError(
            401,
            "Invalid or expired refresh token"
        );
    }

    /*
    ========================================
    VERIFY TOKEN AGAINST DB
    ========================================
    */

    if (
        user.refreshToken !==
        incomingRefreshToken
    ) {
        throw new ApiError(
            401,
            "Invalid or expired refresh token"
        );
    }

    /*
     ========================================
     GENERATE NEW TOKENS
     ========================================
     */

    const {
        accessToken,
        refreshToken,
    } =
        await generateAccessAndRefreshTokens(
            user._id
        );
    /*
     ========================================
     RETURN NEW TOKENS
     ========================================
     */

    return {
        accessToken,
        refreshToken,
    };
}

/*
========================================
LOGOUT USER SERVICE
========================================
*/

const logoutUser = async (userId) => {
  /*
  ========================================
  VALIDATE USER ID
  ========================================
  */

  if (!userId) {
    throw new ApiError(
      400,
      "User ID is required"
    );
  }

  /*
  ========================================
  FIND USER
  ========================================
  */

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(
      404,
      "User not found"
    );
  }

  /*
  ========================================
  INVALIDATE SESSION
  ========================================
  */

  user.refreshToken = "";

  await user.save({
    validateBeforeSave: false,
  });

  /*
  ========================================
  RETURN SUCCESS
  ========================================
  */

  return {
    success: true,
  };
  
}
const getCurrentUser = async () => {

}

// phase 2 :
/*
1. loginWithGoogle()
2. forgotPassword()
3. resetPassword()
4. verifyEmail()
5. sendOTP()
6. verifyOTP()
*/

export { registerUser, generateAccessAndRefreshTokens, loginUser, refreshAccessToken ,logoutUser,getCurrentUser};