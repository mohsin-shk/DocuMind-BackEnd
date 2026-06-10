# Documind API

Base URL: `{{documind_server}}`

An AI-powered document analysis platform that enables smart document upload,  
text extraction, embedding generation, and context-aware Q&A chat.

## Authentication

All protected routes require a Bearer token in the Authorization header:  
`Authorization: Bearer {{accessToken}}`

Access tokens expire. Use `POST /auth/refresh` with your refresh token cookie to get a new one.

## Error Format

All errors follow this structure:

``` json
{  
"statusCode": 400,  
"message": "Error message here",  
"success": false,  
"errors": []  
}  

 ```

## Environment Variables

| Variable | Description |
| --- | --- |
| `documind_server` | API base URL e.g. `http://localhost:8000/api/v1` |
| `accessToken` | JWT access token (set automatically after login/refresh) |
| `refreshToken` | JWT refresh token (stored as an httpOnly cookie by the server) |

## Auth

Handles user registration, login, logout, and token management.  
Refresh token is stored in an httpOnly cookie automatically.

## Documents

Handles document upload, processing, retrieval, and deletion.  
All routes require authentication.  
Document processing (text extraction + embedding) happens asynchronously after upload.

## Chats

Handles AI chat sessions tied to documents.  
Each chat belongs to a document and maintains message history.  
All routes require authentication.


## Register a User

Creates a new user account. Accepts user details and registers them, returning a success response upon account creation. No tokens are issued at this stage — the user must log in separately.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `POST` |
| **Endpoint** | `{{documind_server}}/auth/register` |
| **Auth Required** | `❌ No` |

## Request Body

The request body must be sent as **raw JSON** (`Content-Type: application/json`).

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `fullName` | `string` | ✅ Required | The full name of the user (e.g., first and last name).|
 `username` | `string` | ✅ Required | A unique username for the account. Must not already be taken.|
  `email` | `string` | ✅ Required | A valid and unique email address.|
| `password` | `string` | ✅ Required | Account password. Must meet strength requirements (min 8 chars, uppercase, lowercase, number, special character). |

## Example Request Body
```json
 {
  "fullName": "John Doe",
  "username": "john_14",
  "email": "john_doe@hotmail.com",
  "password": "543321Mm#"
}
```


## Responses

- **✅ 201 Created — Registration Successful**  
```json
{
    "statusCode": 201,
    "data": {
        "avatar": {
            "url": "",
            "publicId": ""
        },
        "authProviders": {
            "google": {
                "providerId": "",
                "email": ""
            }
        },
        "aiUsage": {
            "documentsUploaded": 0,
            "tokensUsed": 0,
            "questionsAsked": 0,
            "lastUsageReset": "2026-06-03T15:33:37.432Z"
        },
        "preferences": {
            "theme": "light",
            "notifications": true
        },
        "_id": "6a204951cdf04077fd937ff8",
        "fullName": "Jake Hill",
        "username": "jake_44",
        "email": "jakehill44@gmail.com",
        "isEmailVerified": false,
        "isPhoneVerified": false,
        "role": "user",
        "accountStatus": "active",
        "createdAt": "2026-06-03T15:33:37.437Z",
        "updatedAt": "2026-06-03T15:33:37.437Z",
        "__v": 0
    },
    "message": "User registered successfully",
    "success": true
}

```
    
- **❌ 400 Bad Request — Validation Failed**
Returned when one or more required fields are missing or fail validation.
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        "Full name must be at least 2 characters"
    ],
    "stack": "Error: Validation failed"
}

```    
    
- **❌ 409 Conflict — Duplicate Username or Email**
```json
{
    "success": false,
    "message": "Username already exists",
    "errors": [],
    "stack": "Error: Username already exists"
}

```

---
> **Security Note:**  
Passwords are hashed server-side before storage and are never returned in any response. Avoid logging plain-text passwords outside of local testing environments.

## Refresh Access Token

Issues a new JWT access token using the refreshToken stored in the httpOnly cookie. Use this endpoint when the current access token has expired to maintain an authenticated session without requiring the user to log in again.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `POST` |
| **Endpoint** | `{{documind_server}}/auth/refresh-token` |
| **Auth Required** | `❌ No (uses cookie instead)` |

## Request Body

No request body required. The server reads the refreshToken automatically from the httpOnly cookie attached to the request.

---

## Responses

- **✅ 200 OK — Token Refreshed Successfully**  
The new accessToken should be stored in your {{accessToken}} environment variable to authenticate subsequent requests.
```json
{
    "statusCode": 200,
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTIwNDk1MWNkZjA0MDc3ZmQ5MzdmZjgiLCJlbWFpbCI6Impha2VoaWxsNDRAZ21haWwuY29tIiwidXNlcm5hbWUiOiJqYWtlXzQ0Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3ODA1MDExNzAsImV4cCI6MTc4MDUwMjA3MH0.fXJul9R14P3rzH0OMGMfEoDUDCSqMXmVjh0Ereblnk8"
    },
    "message": "Access token refreshed successfully",
    "success": true
}

```
    
- **❌ 401 Unauthorized — Missing or Expired Refresh Token**  
Returned when the refresh token cookie is absent, has expired, or has been invalidated (e.g., after logout).

```json

{
    "success": false,
    "message": "Invalid or expired refresh token",
    "errors": [],
    "stack": "Error: Invalid or expired refresh token"
}

```
    
> **Note**  
If this endpoint returns a 401, the user's session cannot be recovered and they must log in again via POST /auth/login.


## Login a User

Authenticates an existing user using their credentials. On success, returns a JWT access token in the response body and sets a refreshToken as an httpOnly cookie.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `POST` |
| **Endpoint** | `{{documind_server}}/auth/login` |
| **Auth Required** | `❌ No` |

## Request Body

The request body must be sent as **raw JSON** (`Content-Type: application/json`).

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `email/username` | `string` | ✅ Required | The registered email address of the user. |
| `password` | `string` | ✅ Required | The account password. |

---

## Example Request Body

``` json
{
  "email": "john_doe@hotmail.com",
  "password": "543321Mm#"
}

 ```

---

## Responses

- **✅200 OK — Login Successful**  
The accessToken is returned in the response body and automatically stored in the {{accessToken}} environment variable. The refreshToken is issued as an httpOnly cookie by the server. 

```json

{
    "statusCode": 200,
    "data": {
        "user": {
            "avatar": {
                "url": "",
                "publicId": ""
            },
            "authProviders": {
                "google": {
                    "providerId": "",
                    "email": ""
                }
            },
            "aiUsage": {
                "documentsUploaded": 0,
                "tokensUsed": 0,
                "questionsAsked": 0,
                "lastUsageReset": "2026-06-03T15:33:37.432Z"
            },
            "preferences": {
                "theme": "light",
                "notifications": true
            },
            "_id": "6a204951cdf04077fd937ff8",
            "fullName": "Jake Hill",
            "username": "jake_44",
            "email": "jakehill44@gmail.com",
            "isEmailVerified": false,
            "isPhoneVerified": false,
            "role": "user",
            "accountStatus": "active",
            "createdAt": "2026-06-03T15:33:37.437Z",
            "updatedAt": "2026-06-03T15:33:37.437Z",
            "__v": 0
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTIwNDk1MWNkZjA0MDc3ZmQ5MzdmZjgiLCJlbWFpbCI6Impha2VoaWxsNDRAZ21haWwuY29tIiwidXNlcm5hbWUiOiJqYWtlXzQ0Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3ODA1MDExNTksImV4cCI6MTc4MDUwMjA1OX0.OYfbBKHizbNHkU3oQwOkzIy9Pw_nhAtj5jrpBLXUYLA"
    },
    "message": "Login successful",
    "success": true
}

```

Cookie set by server:  
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/
    
- **❌ 400 Bad Request — Missing Fields**
```json

{
    "success": false,
    "message": "Validation failed",
    "errors": [
        "Email or username is required"
    ],
    "stack": "Error: Validation failed"
}

```

    
- **❌ 401 Unauthorized — Invalid Credentials**
```json

{
    "success": false,
    "message": "Invalid credentials",
    "errors": [],
    "stack": "Error: Invalid credentials"
}

```
    

> **Note**  
For security, the server returns the same 401 error whether the email doesn't exist or the password is wrong — this prevents user enumeration attacks.testing environments.

## Logout

Terminates the current user session. Invalidates the active refresh token on the server and clears the refreshToken httpOnly cookie. The access token will continue to work until it naturally expires — ensure the client discards it immediately on logout.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `POST` |
| **Endpoint** | `{{documind_server}}/auth/logout` |
| **Auth Required** | `✅ Yes — Authorization: Bearer {{accessToken}}` |

## Request Body

No request body required.

## Responses

- **✅ 200 OK — Logout Successful**  

```json

{
    "statusCode": 200,
    "data": {},
    "message": "Logout successful",
    "success": true
}

```
The server also clears the refreshToken cookie:  
Set-Cookie: refreshToken=; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/
    
- **❌ 401 Unauthorized — Missing or Invalid Access Token**

```json

{
    "success": false,
    "message": "Unauthorized access",
    "errors": [],
    "stack": "Error: Unauthorized access"
}

```
    
> **Client Responsibility:**  
After a successful logout, the client must discard the stored accessToken and clear any local session state. Subsequent requests using the old access token will be rejected once it expires.


## Get Current User

Returns the profile information of the currently authenticated user based on the provided access token. Useful for verifying session state and populating user profile data on the frontend.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `POST` |
| **Endpoint** | `{{documind_server}}/auth/me` |
| **Auth Required** | `✅ Yes — Authorization: Bearer {{accessToken}}` |

## Request Body

None — this is a GET request.

---

## Responses

- **✅ 200 OK — User Fetched Successfully**

```json

{
    "statusCode": 200,
    "data": {
        "user": {
            "avatar": {
                "url": "",
                "publicId": ""
            },
            "authProviders": {
                "google": {
                    "connected": false
                }
            },
            "aiUsage": {
                "documentsUploaded": 0,
                "tokensUsed": 0,
                "questionsAsked": 0,
                "lastUsageReset": "2026-06-03T15:33:37.432Z"
            },
            "preferences": {
                "theme": "light",
                "notifications": true
            },
            "_id": "6a204951cdf04077fd937ff8",
            "fullName": "Jake Hill",
            "username": "jake_44",
            "email": "jakehill44@gmail.com",
            "isEmailVerified": false,
            "isPhoneVerified": false,
            "role": "user",
            "accountStatus": "active",
            "createdAt": "2026-06-03T15:33:37.437Z",
            "lastLogin": "2026-06-03T15:51:23.509Z"
        }
    },
    "message": "Current User fetched successfully",
    "success": true
}

```
    
- **❌ 401 Unauthorized — Missing or Expired Access Token**

```json

{
    "success": false,
    "message": "Unauthorized access",
    "errors": [],
    "stack": "Error: Unauthorized access"
}

```
    
> **Tip**  
This endpoint is ideal to call on app load to check if the user's session is still valid. If it returns 401, trigger a token refresh via POST /auth/refresh before prompting re-login.


## Upload a Document

Uploads a new document for the authenticated user. The server processes the file by extracting its text content and generating embeddings for AI-powered Q&A. Accepted file types should match what your server supports (e.g. .pdf, .txt, .docx).

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `POST` |
| **Endpoint** | `{{documind_server}}/documents` |
| **Auth Required** | `✅ Yes — Authorization: Bearer {{accessToken}}` |
| **Content-Type** | `multipart/form-data` |

## Request Body

The request body must be sent as form-data.


| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `document` | `File` | ✅ Required | The document file selected from local storage. |


---

## Example Request(form-data)

``` json
Key: document    Type: File      Value: resume.pdf
 
```

---

## Responses

- **✅ 201 Created — Document Uploaded Successfully** 

```json

{
    "statusCode": 201,
    "data": {
        "storage": {
            "provider": "cloudinary",
            "url": "https://res.cloudinary.com/dvu8jruf1/raw/upload/v1780505056/documind/documents/ppzmmhjxmw3ouhbnqsqh.docx",
            "publicId": "documind/documents/ppzmmhjxmw3ouhbnqsqh.docx"
        },
        "_id": "6a2059e1eeb203566eb5a809",
        "owner": "6a204951cdf04077fd937ff8",
        "title": "World War II",
        "originalFileName": "World War II.docx",
        "fileExtension": "docx",
        "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "fileSize": 14905,
        "pageCount": 0,
        "processingStatus": "ready",
        "processingError": "",
        "extractedText": "World War II World War II was the largest and deadliest conflict in human history, lasting from 1939 to 1945. It involved more than 30 countries and was fought across Europe, the Pacific, Atlantic, and North Africa. The war fundamentally changed the global balance of power, shifting it away from traditional European empires and leading directly into the Cold War. The seeds of the war were planted at the end of World War I. The Treaty of Versailles imposed harsh financial punishments and lost territories on Germany, which caused massive economic instability and deep resentment among the German people. When the Great Depression hit in 1929, it triggered global financial chaos. Out of this desperation, totalitarian dictators rose to power—Adolf Hitler in Germany, Benito Mussolini in Italy, and military leaders in Japan. These leaders promised national rebirth through military expansion. Meanwhile, international bodies like the League of Nations failed to stop early acts of aggression, and European powers initially used a policy of \"appeasement,\" giving into Hitler's early demands in a failed attempt to avoid another major war. The conflict officially exploded in September 1939 when Germany invaded Poland, prompting Britain and France to declare war. The fighting was characterized by \"total war,\" meaning entire economies and civilian populations were mobilized for the war effort. It was a clash of massive industrial production and rapid technological leaps, introducing radar, jet engines, ballistic missiles, and eventually nuclear weapons. Major turning points, like the brutal Battle of Stalingrad in Russia and the naval Battle of Midway in the Pacific, slowly turned the tide against Germany and Japan. Tragically, the war was also marked by unprecedented civilian suffering, most notably the Holocaust, the systematic state-sponsored murder of six million Jews and millions of others by the Nazi regime. The war ended in 1945 with the total surrender of the Axis powers following the fall of Berlin and the dropping of two atomic bombs on Japan. The aftermath reshaped the world map. European empires were left broke and exhausted, which accelerated independence movements across Africa and Asia. The United States and the Soviet Union emerged as the world's two competing superpowers, dividing the globe into capitalist and communist blocs. To prevent such a catastrophic conflict from happening again, world leaders formed the United Nations, establishing a new framework for international diplomacy and human rights that still shapes our world today.",
        "vectorNamespace": "user-6a204951cdf04077fd937ff8",
        "chunkCount": 4,
        "isDeleted": false,
        "createdAt": "2026-06-03T16:44:17.744Z",
        "updatedAt": "2026-06-03T16:44:26.530Z",
        "__v": 0,
        "processedAt": "2026-06-03T16:44:26.529Z"
    },
    "message": "Document uploaded successfully",
    "success": true
}

```

    
- **❌ 400 Bad Request — Missing Fields**
Returned when the file is missing.

```json

{
    "success": false,
    "message": "Document file is required",
    "errors": [],
    "stack": "Error: Document file is required"
}

```
- **❌ 400 Bad Request — for File other than pdf,docx or txt files**

```json
{
    "success": false,
    "message": "Unsupported file type. Only PDF, DOCX, and TXT files are allowed.",
    "errors": [],
    "stack": "Error: Unsupported file type. Only PDF, DOCX, and TXT files are allowed."
}

```
    
- **❌ 401 Unauthorized — Missing or Expired Access Token**

```json

{
    "success": false,
    "message": "Unauthorized access",
    "errors": [],
    "stack": "Error: Unauthorized access"
}

```

- **❌ 500 Bad Request — Failed to process or upload document**

```json

{
    "success": false,
    "message": "Failed to fetch processed document",
    "errors": [],
    "stack": "Error: Document Processing Failed"
}

```

- **❌ 500 Payload Too Large — File Exceeds Size Limit**
```json

{
    "success": false,
    "message": "File too large",
    "errors": [],
    "stack": "MulterError: File too large"
}

```

> **Note**  
Do not set the Content-Type header manually when sending form-data — let Postman (or your HTTP client) set it automatically, including the required boundary value. Setting it manually will break the request.


## Get User's Documents

Retrieves a list of all documents uploaded by the currently authenticated user.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `GET` |
| **Endpoint** | `{{documind_server}}/documents` |
| **Auth Required** | `✅ Yes — Authorization: Bearer {{accessToken}}` |


## Request Body
None — this is a GET request.

## Query Parameters
None currently. Consider supporting page, limit, and sort in the future for pagination as the document count grows.

## Responses

- **✅ 200 OK — Documents Fetched Successfully** 

```json

{
    "statusCode": 200,
    "data": {
        "documents": [
            {
                "storage": {
                    "provider": "cloudinary",
                    "url": "https://res.cloudinary.com/dvu8jruf1/raw/upload/v1780552275/documind/documents/sxsww31xjbxyfmju5yqh.docx",
                    "publicId": "documind/documents/sxsww31xjbxyfmju5yqh.docx"
                },
                "_id": "6a2112531b2855db0c00881c",
                "owner": "6a204951cdf04077fd937ff8",
                "title": "Artificial Intelligence",
                "originalFileName": "Artificial Intelligence.docx",
                "fileExtension": "docx",
                "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "fileSize": 14714,
                "pageCount": 0,
                "processingStatus": "ready",
                "processingError": "",
                "vectorNamespace": "user-6a204951cdf04077fd937ff8",
                "chunkCount": 3,
                "isDeleted": false,
                "createdAt": "2026-06-04T05:51:15.032Z",
                "updatedAt": "2026-06-04T05:51:22.350Z",
                "__v": 0,
                "processedAt": "2026-06-04T05:51:22.350Z"
            },
            {
                "storage": {
                    "provider": "cloudinary",
                    "url": "https://res.cloudinary.com/dvu8jruf1/raw/upload/v1780505056/documind/documents/ppzmmhjxmw3ouhbnqsqh.docx",
                    "publicId": "documind/documents/ppzmmhjxmw3ouhbnqsqh.docx"
                },
                "_id": "6a2059e1eeb203566eb5a809",
                "owner": "6a204951cdf04077fd937ff8",
                "title": "World War II",
                "originalFileName": "World War II.docx",
                "fileExtension": "docx",
                "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "fileSize": 14905,
                "pageCount": 0,
                "processingStatus": "ready",
                "processingError": "",
                "vectorNamespace": "user-6a204951cdf04077fd937ff8",
                "chunkCount": 4,
                "isDeleted": false,
                "createdAt": "2026-06-03T16:44:17.744Z",
                "updatedAt": "2026-06-03T16:44:26.530Z",
                "__v": 0,
                "processedAt": "2026-06-03T16:44:26.529Z"
            }
        ],
        "count": 2
    },
    "message": "Documents fetched successfully",
    "success": true
}

```
If the user has no uploaded documents, data returns an empty array — not a 404.
```json

{
    "statusCode": 200,
    "data": {
        "documents": [],
        "count": 0
    },
    "message": "Documents fetched successfully",
    "success": true
}

```
    
- **❌ 401 Unauthorized — Missing or Expired Access Token**
```json

{
    "success": false,
    "message": "Unauthorized access",
    "errors": [],
    "stack": "Error: Unauthorized access"
}

```


## Get a Document

Retrieves the metadata of a single document belonging to the authenticated user by its ID.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `GET` |
| **Endpoint** | `{{documind_server}}/documents/:documentId` |
| **Auth Required** | `✅ Yes — Authorization: Bearer {{accessToken}}` |


## Path Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| **documentId** | **string** | `✅ Required` | `The unique ID of the document to retrieve.` |

## Example Request

```
GET {{documind_server}}/documents/64f1a2b3c4d5e6f7a8b9c0d2

```
## Request Body

None — this is a GET request.

## Responses

- **✅ 200 OK — Document Fetched Successfully** 
```json

{
    "statusCode": 200,
    "data": {
        "storage": {
            "provider": "cloudinary",
            "url": "https://res.cloudinary.com/dvu8jruf1/raw/upload/v1780552275/documind/documents/sxsww31xjbxyfmju5yqh.docx",
            "publicId": "documind/documents/sxsww31xjbxyfmju5yqh.docx"
        },
        "_id": "6a2112531b2855db0c00881c",
        "owner": "6a204951cdf04077fd937ff8",
        "title": "Artificial Intelligence",
        "originalFileName": "Artificial Intelligence.docx",
        "fileExtension": "docx",
        "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "fileSize": 14714,
        "pageCount": 0,
        "processingStatus": "ready",
        "processingError": "",
        "vectorNamespace": "user-6a204951cdf04077fd937ff8",
        "chunkCount": 3,
        "isDeleted": false,
        "createdAt": "2026-06-04T05:51:15.032Z",
        "updatedAt": "2026-06-04T05:51:22.350Z",
        "__v": 0,
        "processedAt": "2026-06-04T05:51:22.350Z"
    },
    "message": "Document fetched successfully",
    "success": true
}

```
    
- **❌ 401 Unauthorized — Missing or Expired Access Token**
```json

{
    "success": false,
    "message": "Unauthorized access",
    "errors": [],
    "stack": "Error: Unauthorized access"
}

```

- **❌ 404 Not Found — Document Does Not Exist**

```json

{
    "success": false,
    "message": "Document not found",
    "errors": [],
    "stack": "Error: Document not found"
}

```

>**Note :**
A 403 and 404 are both possible when a document ID doesn't belong to the requesting user. Returning 404 in both cases is also an acceptable server-side choice — it avoids leaking whether a document exists at all.


## Delete a Document

Permanently deletes a document belonging to the authenticated user by its ID. This also removes any associated embeddings and chat history linked to the document.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `DELETE` |
| **Endpoint** | `{{documind_server}}/documents/:documentId` |
| **Auth Required** | `✅ Yes — Authorization: Bearer {{accessToken}}` |


## Path Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| **documentId** | **string** | `✅ Required` | `The unique ID of the document to delete.` |

## Example Request

```
DELETE {{documind_server}}/documents/64f1a2b3c4d5e6f7a8b9c0d2

```
## Request Body
None.

## Responses

- **✅ 200 OK — Document Deleted Successfully**

```json

{
    "statusCode": 200,
    "data": {
        "documentId": "6a2112531b2855db0c00881c"
    },
    "message": "Document deleted successfully",
    "success": true
}

``` 
    
- **❌ 401 Unauthorized — Missing or Expired Access Token**

```json

{
    "success": false,
    "message": "Unauthorized access",
    "errors": [],
    "stack": "Error: Unauthorized access"
}

``` 

- **❌ 404 Not Found — Document Does Not Exist**

```json

{
    "success": false,
    "message": "Document not found",
    "errors": [],
    "stack": "Error: Document not found"
}

``` 

>**Warning**
This action is irreversible. Once deleted, the document, its extracted text, embeddings, and any associated chats cannot be recovered. Consider prompting the user for confirmation on the frontend before calling this endpoint.



## Create a New Chat

Creates a new chat session for the authenticated user, linked to one or more documents. The chat context is scoped to the provided documents — all subsequent messages in this chat will be answered based on their content.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `POST` |
| **Endpoint** | `{{documind_server}}/chats` |
| **Auth Required** | `✅ Yes — Authorization: Bearer {{accessToken}}` |
| **Content-Type** | `application/json` |


## Request Body
The request body must be sent as raw JSON (Content-Type: application/json).
| Field | Type | Required | Description |
| --- | --- | --- | --- |
| **documentIds** | **array of strings** | `✅ Required` | `One or more document IDs to associate with this chat. All referenced documents must belong to the authenticated user.` |

## Example Request Body 

Single document:

```

{
  "documentIds": ["64f1a2b3c4d5e6f7a8b9c0d2"]
}

```
Multiple documents:

```

{
  "documentIds": [
    "64f1a2b3c4d5e6f7a8b9c0d2",
    "64f1a2b3c4d5e6f7a8b9c0d3"
  ]
}

```

## Responses

- **✅ 201 Created — Chat Created Successfully**

```json

{
    "statusCode": 201,
    "data": {
        "owner": "6a2161d536d9f5a61df67c8e",
        "title": "New Chat",
        "documents": [
            "6a21622736d9f5a61df67c8f"
        ],
        "_id": "6a2162a536d9f5a61df67c90",
        "lastMessageAt": "2026-06-04T11:33:57.171Z",
        "createdAt": "2026-06-04T11:33:57.171Z",
        "updatedAt": "2026-06-04T11:33:57.171Z",
        "__v": 0
    },
    "message": "Chat created successfully",
    "success": true
}

``` 
    
- **❌ 400 Bad Request — Missing or Empty documentIds**

```json

{
    "success": false,
    "message": "Validation failed",
    "errors": [
        "At least one document is required to start a chat"
    ],
    "stack": "Error: Validation failed"
}

``` 

- **❌ 401 Unauthorized — Missing or Expired Access Token**

```json

{
    "success": false,
    "message": "Unauthorized access",
    "errors": [],
    "stack": "Error: Unauthorized access"
}

``` 

- **❌ 404 Not Found — One or More Documents Not Found**

```json

{
    "success": false,
    "message": "One or more documents are invalid or do not belong to you",
    "errors": [],
    "stack": "Error: One or more documents are invalid or do not belong to you"
}

```

>**Note**
All document IDs in the array must belong to the authenticated user. If any single ID is invalid or unauthorized, the entire request will be rejected.



## Get User's Chats

Retrieves all chat sessions belonging to the currently authenticated user. Returns a list of chats with their metadata — does not include individual messages.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `GET` |
| **Endpoint** | `{{documind_server}}/chats` |
| **Auth Required** | `✅ Yes — Authorization: Bearer {{accessToken}}` |



## Request Body
None — this is a GET request.

## Responses

- **✅ 200 OK — Chats Fetched Successfully**

```json

{
    "statusCode": 200,
    "data": [
        {
            "_id": "6a2174bc26f5c27625aa6ab3",
            "title": "Aftermath of World War II Summary",
            "documents": [
                {
                    "_id": "6a2173fdcc675f5d5fd8fd58",
                    "title": "World War II"
                }
            ],
            "documentCount": 1,
            "lastMessage": {
                "role": "assistant",
                "content": "The aftermath of World War II saw the collapse of European empires, accelerating independence movements in Africa and Asia. The United States and the Soviet Union emerged as the two superpowers, dividing the world into capitalist and communist blocs.",
                "createdAt": "2026-06-04T12:54:36.388Z"
            },
            "lastMessageAt": "2026-06-04T12:54:36.351Z",
            "createdAt": "2026-06-04T12:51:08.615Z"
        },
        {
            "_id": "6a2162a536d9f5a61df67c90",
            "title": "Global Warming Explanation Summary",
            "documents": [
                {
                    "_id": "6a21622736d9f5a61df67c8f",
                    "title": "sample"
                }
            ],
            "documentCount": 1,
            "lastMessage": {
                "role": "assistant",
                "content": "The current consequences of temperature rising due to global warming include:\n\n- Melting glaciers and rising sea levels, threatening coastal cities and low-lying island nations with permanent flooding.\n- More frequent and extreme weather events such as longer and hotter heatwaves, droughts threatening global agriculture and food security, and more frequent and destructive hurricanes and cyclones.\n- Loss of biodiversity, with ecosystems unable to adapt quickly, coral reefs suffering massive bleaching, and many plant and animal species facing a high risk of extinction as their habitats vanish.",
                "createdAt": "2026-06-04T12:45:53.125Z"
            },
            "lastMessageAt": "2026-06-04T12:45:53.112Z",
            "createdAt": "2026-06-04T11:33:57.171Z"
        }
    ],
    "message": "Chats fetched successfully",
    "success": true
}

``` 
If the user has no chats yet, data returns an empty array — not a 404.

```json

{
    "statusCode": 200,
    "data": [],
    "message": "Chats fetched successfully",
    "success": true
}

```
    

- **❌ 401 Unauthorized — Missing or Expired Access Token**

```json

{
    "success": false,
    "message": "Unauthorized access",
    "errors": [],
    "stack": "Error: Unauthorized access"
}

``` 


## Get a Chat's Messages

Retrieves a specific chat session along with its full message history for the authenticated user.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `GET` |
| **Endpoint** | `{{documind_server}}/chats/:chatId/messages` |
| **Auth Required** | `✅ Yes — Authorization: Bearer {{accessToken}}` |


## Path Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| **chatId** | **string** | `✅ Required` | `The unique ID of the chat to retrieve.` |

## Example Response 

```

GET {{documind_server}}/chats/72a3b1c4d5e6f7a8b9c0d1e2

```

## Request Body
None — this is a GET request.

## Responses

- **✅ 200 OK — Chats Fetched Successfully**

```json

{
    "statusCode": 200,
    "data": {
        "chat": {
            "_id": "6a2162a536d9f5a61df67c90",
            "owner": "6a2161d536d9f5a61df67c8e",
            "title": "Global Warming Explanation Summary",
            "documents": [
                {
                    "_id": "6a21622736d9f5a61df67c8f",
                    "title": "sample"
                }
            ],
            "lastMessageAt": "2026-06-04T12:45:53.112Z",
            "createdAt": "2026-06-04T11:33:57.171Z",
            "updatedAt": "2026-06-04T12:45:53.112Z",
            "__v": 0
        },
        "messages": [
            {
                "tokenUsage": {
                    "promptTokens": 0,
                    "completionTokens": 0,
                    "totalTokens": 0
                },
                "_id": "6a217158cc675f5d5fd8fd4e",
                "chat": "6a2162a536d9f5a61df67c90",
                "role": "user",
                "content": "In 2-3 lines can you explain me global warming ? as the document discusses",
                "model": "",
                "responseTime": 0,
                "sources": [],
                "createdAt": "2026-06-04T12:36:40.720Z",
                "updatedAt": "2026-06-04T12:36:40.720Z",
                "__v": 0
            },
            {
                "tokenUsage": {
                    "promptTokens": 459,
                    "completionTokens": 53,
                    "totalTokens": 512
                },
                "_id": "6a217164cc675f5d5fd8fd4f",
                "chat": "6a2162a536d9f5a61df67c90",
                "role": "assistant",
                "content": "Global warming is the long-term increase in Earth's average surface temperature caused primarily by human activities like burning fossil fuels and deforestation. These actions release greenhouse gases such as CO2 and methane, which trap heat in the atmosphere, leading to climate shifts and severe environmental impacts.",
                "sources": [
                    {
                        "documentId": "6a21622736d9f5a61df67c8f",
                        "title": "sample",
                        "_id": "6a217164cc675f5d5fd8fd50"
                    }
                ],
                "model": "gpt-4.1-mini",
                "responseTime": 10797,
                "createdAt": "2026-06-04T12:36:52.881Z",
                "updatedAt": "2026-06-04T12:36:52.881Z",
                "__v": 0
            },
            {
                "tokenUsage": {
                    "promptTokens": 0,
                    "completionTokens": 0,
                    "totalTokens": 0
                },
                "_id": "6a217329cc675f5d5fd8fd52",
                "chat": "6a2162a536d9f5a61df67c90",
                "role": "user",
                "content": "okay what about the methods or ways the document discuss to combat or deal with Global Warming ? just tell me in short",
                "model": "",
                "responseTime": 0,
                "sources": [],
                "createdAt": "2026-06-04T12:44:25.817Z",
                "updatedAt": "2026-06-04T12:44:25.817Z",
                "__v": 0
            },
            {
                "tokenUsage": {
                    "promptTokens": 0,
                    "completionTokens": 0,
                    "totalTokens": 0
                },
                "_id": "6a21732dcc675f5d5fd8fd53",
                "chat": "6a2162a536d9f5a61df67c90",
                "role": "assistant",
                "content": "I couldn't find relevant information in your uploaded documents.",
                "sources": [],
                "model": "gpt-4.1-mini",
                "responseTime": 3863,
                "createdAt": "2026-06-04T12:44:29.777Z",
                "updatedAt": "2026-06-04T12:44:29.777Z",
                "__v": 0
            },
            {
                "tokenUsage": {
                    "promptTokens": 0,
                    "completionTokens": 0,
                    "totalTokens": 0
                },
                "_id": "6a21737bcc675f5d5fd8fd55",
                "chat": "6a2162a536d9f5a61df67c90",
                "role": "user",
                "content": "what are the current consequences of temprature rising due to global warming ?",
                "model": "",
                "responseTime": 0,
                "sources": [],
                "createdAt": "2026-06-04T12:45:47.299Z",
                "updatedAt": "2026-06-04T12:45:47.299Z",
                "__v": 0
            },
            {
                "tokenUsage": {
                    "promptTokens": 437,
                    "completionTokens": 103,
                    "totalTokens": 540
                },
                "_id": "6a217381cc675f5d5fd8fd56",
                "chat": "6a2162a536d9f5a61df67c90",
                "role": "assistant",
                "content": "The current consequences of temperature rising due to global warming include:\n\n- Melting glaciers and rising sea levels, threatening coastal cities and low-lying island nations with permanent flooding.\n- More frequent and extreme weather events such as longer and hotter heatwaves, droughts threatening global agriculture and food security, and more frequent and destructive hurricanes and cyclones.\n- Loss of biodiversity, with ecosystems unable to adapt quickly, coral reefs suffering massive bleaching, and many plant and animal species facing a high risk of extinction as their habitats vanish.",
                "sources": [
                    {
                        "documentId": "6a21622736d9f5a61df67c8f",
                        "title": "sample",
                        "_id": "6a217381cc675f5d5fd8fd57"
                    }
                ],
                "model": "gpt-4.1-mini",
                "responseTime": 5796,
                "createdAt": "2026-06-04T12:45:53.125Z",
                "updatedAt": "2026-06-04T12:45:53.125Z",
                "__v": 0
            }
        ]
    },
    "message": "Chat messages fetched successfully",
    "success": true
}

``` 

- **❌ 404 Not Found — Chat Does Not Exist**
```json

{
    "success": false,
    "message": "Chat not found",
    "errors": [],
    "stack": "Error: Chat not found"
}

```
    
- **❌ 401 Unauthorized — Missing or Expired Access Token**

```json

{
    "success": false,
    "message": "Unauthorized access",
    "errors": [],
    "stack": "Error: Unauthorized access"
}

``` 



## Send a Message

Sends a user message in a specific chat and returns the AI-generated response based on the documents linked to that chat.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `POST` |
| **Endpoint** | `{{documind_server}}/chats/:chatId/messages` |
| **Auth Required** | `✅ Yes — Authorization: Bearer {{accessToken}}` |
| **Content-Type** | `application/json` |


## Path Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| **chatId** | **string** | `✅ Required` | `The unique ID of the chat to send the message in.` |

## Example Response 

```

POST {{documind_server}}/chats/72a3b1c4d5e6f7a8b9c0d1e2/messages

```

## Request Body
| Field | Type | Required | Description |
| --- | --- | --- | --- |
| **content** | **string** | `✅ Required` | `The user's message or question to send to the AI.` |

## Example Request Body 
```json

{
  "content": "Summarize the key skills mentioned in this document."
}

```

## Responses

- **✅ 201 Created — Message Sent and Response Generated**
Both the user message and the AI response are returned. The frontend can render both immediately without a separate fetch.

```json

{
    "statusCode": 200,
    "data": {
        "chatId": "6a2174bc26f5c27625aa6ab3",
        "userMessage": {
            "chat": "6a2174bc26f5c27625aa6ab3",
            "role": "user",
            "content": "explain me in short the aftermath of world war 2.",
            "tokenUsage": {
                "promptTokens": 0,
                "completionTokens": 0,
                "totalTokens": 0
            },
            "model": "",
            "responseTime": 0,
            "_id": "6a21757b26f5c27625aa6ab4",
            "sources": [],
            "createdAt": "2026-06-04T12:54:19.680Z",
            "updatedAt": "2026-06-04T12:54:19.680Z",
            "__v": 0
        },
        "assistantMessage": {
            "chat": "6a2174bc26f5c27625aa6ab3",
            "role": "assistant",
            "content": "The aftermath of World War II saw the collapse of European empires, accelerating independence movements in Africa and Asia. The United States and the Soviet Union emerged as the two superpowers, dividing the world into capitalist and communist blocs.",
            "sources": [
                {
                    "documentId": "6a2173fdcc675f5d5fd8fd58",
                    "title": "World War II",
                    "_id": "6a21758c26f5c27625aa6ab6"
                }
            ],
            "tokenUsage": {
                "promptTokens": 255,
                "completionTokens": 45,
                "totalTokens": 300
            },
            "model": "gpt-4.1-mini",
            "responseTime": 6780,
            "_id": "6a21758c26f5c27625aa6ab5",
            "createdAt": "2026-06-04T12:54:36.388Z",
            "updatedAt": "2026-06-04T12:54:36.388Z",
            "__v": 0
        }
    },
    "message": "Message sent successfully",
    "success": true
}

``` 
- **❌ 400 Bad Request — Missing Message Content**
```json

{
    "success": false,
    "message": "Validation failed",
    "errors": [
        "Message content is required"
    ],
    "stack": "Error: Validation failed"
}

```


- **❌ 404 Not Found — Chat Does Not Exist**
```json

{
    "success": false,
    "message": "Chat not found",
    "errors": [],
    "stack": "Error: Chat not found"
}

```
    
- **❌ 401 Unauthorized — Missing or Expired Access Token**

```json

{
    "success": false,
    "message": "Unauthorized access",
    "errors": [],
    "stack": "Error: Unauthorized access"
}

``` 



## Delete a Chat

Permanently deletes a specific chat session and all of its messages for the authenticated user. The linked documents are not affected.

---

## Request Details

| Property | Value |
| --- | --- |
| **Method** | `DELETE` |
| **Endpoint** | `{{documind_server}}/chats/:chatId` |
| **Auth Required** | `✅ Yes — Authorization: Bearer {{accessToken}}` |



## Path Parameters
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| **chatId** | **string** | `✅ Required` | `The unique ID of the chat to delete.` |

## Example Response 

```

DELETE {{documind_server}}/chats/72a3b1c4d5e6f7a8b9c0d1e2

```


## Request Body 
None

## Responses

- **✅ 200 OK — Chat Deleted Successfully**

```json

{
    "statusCode": 200,
    "data": {
        "_id": "6a2174bc26f5c27625aa6ab3",
        "owner": "6a2161d536d9f5a61df67c8e",
        "title": "Aftermath of World War II Summary",
        "documents": [
            "6a2173fdcc675f5d5fd8fd58"
        ],
        "lastMessageAt": "2026-06-04T12:54:36.351Z",
        "createdAt": "2026-06-04T12:51:08.615Z",
        "updatedAt": "2026-06-04T12:54:36.351Z",
        "__v": 0
    },
    "message": "Chat deleted successfully",
    "success": true
}

``` 

- **❌ 404 Not Found — Chat Does Not Exist**
```json

{
    "success": false,
    "message": "Chat not found",
    "errors": [],
    "stack": "Error: Chat not found"
}

```
    
- **❌ 401 Unauthorized — Missing or Expired Access Token**

```json

{
    "success": false,
    "message": "Unauthorized access",
    "errors": [],
    "stack": "Error: Unauthorized access"
}

``` 

>**warning**
This action is irreversible. All messages within the chat will be permanently deleted. The documents linked to this chat are not deleted — only the chat session and its history. Consider prompting the user for confirmation on the frontend before calling this endpoint.
