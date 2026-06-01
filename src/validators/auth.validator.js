import { z } from "zod";

/*
========================================
PASSWORD REGEX
========================================
*/

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#^()_\-+=])[A-Za-z\d@$!%*?&.#^()_\-+=]{8,}$/;

/*
========================================
REGISTER SCHEMA
========================================
*/

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(
      2,
      "Full name must be at least 2 characters"
    )
    .max(
      50,
      "Full name cannot exceed 50 characters"
    ),

  username: z
  .string()
  .trim()
  .min(
    3,
    "Username must be at least 3 characters"
  )
  .max(
    20,
    "Username cannot exceed 20 characters"
  )
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers and underscores"
  ),

  email: z
    .string()
    .trim()
    .email(
      "Please provide a valid email address"
    ),

  password: z
    .string()
    .regex(
      passwordRegex,
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
    ),
});


/*
========================================
LOGIN SCHEMA
========================================
*/

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(
      1,
      "Email or username is required"
    ).max(100, "Invalid identifier"),

  password: z
    .string()
    .min(
      1,
      "Password is required"
    ),
});

/*
========================================
REFRESH TOKEN SCHEMA
========================================
*/

const refreshTokenSchema =
  z.object({});

export {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
};