
# Test Matrix for DevHiveSpace

This test matrix outlines the test cases for the DevHiveSpace social media application.

## 1. User Authentication

| Feature | Test Case | Expected Outcome |
|---|---|---|
| **User Registration** | Register with a valid email and password. | User is created, and a verification email is sent. |
| | Register with an existing email. | Error message is displayed. |
| | Register with a weak password. | Error message about password strength is shown. |
| **User Login** | Login with correct credentials. | User is redirected to the dashboard. |
| | Login with incorrect credentials. | Error message is displayed. |
| | Login with an unverified email. | Message to verify email is shown. |
| **Password Reset** | Request a password reset for a valid email. | Password reset link is sent to the email. |
| | Request a password reset for an invalid email. | Error message is displayed. |
| **Social Logins** | Login with Google. | User is authenticated and redirected. |
| | Login with Facebook. | User is authenticated and redirected. |

## 2. User Profile Management

| Feature | Test Case | Expected Outcome |
|---|---|---|
| **View Profile** | A user views their own profile. | All profile details are visible and editable. |
| | A user views another user's profile. | Public profile details are visible. |
| **Update Profile** | Update profile with valid information. | Profile is updated successfully. |
| | Upload a new profile picture. | The new picture is displayed. |
| | Update profile with invalid data. | Error messages are shown for invalid fields. |

## 3. Posts and Content

| Feature | Test Case | Expected Outcome |
|---|---|---|
| **Create Post** | Create a text-only post. | The post appears on the user's timeline and the global feed. |
| | Create a post with an image. | The post and image are displayed correctly. |
| | Create a post with a video. | The post and video are displayed correctly. |
| **Edit Post** | Edit an existing post. | The post is updated. |
| **Delete Post** | Delete a post. | The post is removed from all feeds. |
| **View Posts** | View the global feed. | All public posts are visible. |
| | View a single post. | The post and its comments are displayed. |

## 4. Social Interactions

| Feature | Test Case | Expected Outcome |
|---|---|---|
| **Comments** | Add a comment to a post. | The comment is displayed under the post. |
| | Delete a comment. | The comment is removed. |
| **Reactions** | React to a post (e.g., like, heart). | The reaction count is updated. |
| | Remove a reaction from a post. | The reaction count is updated. |
| **Sharing** | Share a post on another platform. | The share action is recorded. |

## 5. Connections

| Feature | Test Case | Expected Outcome |
|---|---|---|
| **Follow User** | A user follows another user. | The followed user appears in the user's following list. |
| **Unfollow User** | A user unfollows another user. | The unfollowed user is removed from the following list. |

