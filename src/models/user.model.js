import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import { env } from "../configs/env.js";

const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            minlength: 2,
            maxlength: 50,
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            lowercase: true,
            trim: true,
            minlength: 3,
            maxlength: 20,
            index: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            sparse: true,
            validate: {
                validator: validator.isEmail,
                message: "Invalid email format",
            },
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        phoneNumber: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        isPhoneVerified: {
            type: Boolean,
            default: false
        },
        password: {
            type: String,
            required: function () {
                return !this.authProviders?.google?.id;
            },
            minlength: 6,
            select: false,
        },
        avatar: {
            url: {
                type: String,
                default: "",
            },

            publicId: {
                type: String,
                default: "",
            },
        },
        authProviders: {
            google: {
                providerId: {
                    type: String,
                    default: "",
                },

                email: {
                    type: String,
                    default: "",
                },
            },
        }
        ,
        refreshToken: {
            type: String,
            select: false,
            default: "",
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        accountStatus: {
            type: String,
            enum: ["active", "suspended", "deactivated"],
            default: "active",
        },
        lastLogin: {
            type: Date,
        },
        passwordChangedAt: {
            type: Date,
        },
        resetPasswordToken: {
            type: String,
            select: false,
        },
        resetPasswordExpiry: {
            type: Date,
            select: false,
        },
        emailVerificationToken: {
            type: String,
            select: false,
        },
        emailVerificationExpiry: {
            type: Date,
            select: false,
        },
        aiUsage: {
            documentsUploaded: {
                type: Number,
                default: 0,
            },

            tokensUsed: {
                type: Number,
                default: 0,
            },
        },
        preferences: {
            theme: {
                type: String,
                enum: ["light", "dark"],
                default: "light",
            },

            notifications: {
                type: Boolean,
                default: true,
            },
        },

    }, { timestamps: true });

/*
========================================
PASSWORD HASHING MIDDLEWARE
========================================
*/

userSchema.pre("save", async function () {
    // Only hash password if modified
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

/*
========================================
COMPARE PASSWORD METHOD
========================================
*/

userSchema.methods.isPasswordCorrect = async function (
    password
) {
    return await bcrypt.compare(password, this.password);
};

/*
========================================
GENERATE ACCESS TOKEN
========================================
*/

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.role,
        },

        env.ACCESS_TOKEN_SECRET,

        {
            expiresIn: env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

/*
========================================
GENERATE REFRESH TOKEN
========================================
*/

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },

        env.REFRESH_TOKEN_SECRET,

        {
            expiresIn: env.REFRESH_TOKEN_EXPIRY,
        }
    );
};


/*
========================================
REMOVE SENSITIVE FIELDS
========================================
*/

userSchema.methods.toJSON = function () {
    const userObject = this.toObject();

    delete userObject.password;
    delete userObject.refreshToken;

    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpiry;

    delete userObject.emailVerificationToken;
    delete userObject.emailVerificationExpiry;

    return userObject;
};

export const User = mongoose.model("User", userSchema);