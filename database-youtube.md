Certainly! Here's an advanced prompt for designing a detailed database schema for a YouTube-like app, focusing on specific fields, data types, and constraints:

---

**Advanced Prompt for YouTube-Like App Database Schema Design:**

Design a detailed and scalable relational database schema for a YouTube-like video sharing platform. Include comprehensive field definitions, data types, constraints, indexes, and relationships for each entity. The design should support advanced features such as multi-level nested comments, real-time analytics, content moderation, and user interaction tracking.

### Entity Details and Fields:

**1. Users**
- `user_id` (PK, UUID, auto-generated)
- `username` (VARCHAR, unique, not null, indexed)
- `email` (VARCHAR, unique, not null)
- `password_hash` (VARCHAR, not null)
- `profile_picture_url` (TEXT)
- `bio` (TEXT)
- `created_at` (TIMESTAMP, default to current time)
- `role` (ENUM: 'user', 'creator', 'admin')
- `status` (ENUM: 'active', 'suspended', 'deleted')
- **Indexes:** On `username`, `email`

**2. Videos**
- `video_id` (PK, UUID)
- `title` (VARCHAR, not null)
- `description` (TEXT)
- `upload_date` (TIMESTAMP, default current time)
- `duration_seconds` (INT)
- `views_count` (BIGINT, default 0)
- `privacy` (ENUM: 'public', 'private', 'unlisted')
- `category_id` (FK to Categories)
- `creator_id` (FK to Users)
- `video_url` (TEXT, not null)
- `thumbnail_url` (TEXT)
- `is_approved` (BOOLEAN, default false for moderation)
- `language` (VARCHAR)
- **Indexes:** On `title`, `category_id`, `creator_id`

**3. Comments**
- `comment_id` (PK, UUID)
- `video_id` (FK to Videos)
- `user_id` (FK to Users)
- `parent_comment_id` (FK to Comments, nullable, for nested comments)
- `content` (TEXT)
- `created_at` (TIMESTAMP, default current time)
- `status` (ENUM: 'visible', 'hidden', 'deleted')
- **Indexes:** On `video_id`, `user_id`, `parent_comment_id`

**4. Likes/Dislikes**
- `reaction_id` (PK, UUID)
- `user_id` (FK to Users)
- `video_id` (FK to Videos, nullable)
- `comment_id` (FK to Comments, nullable)
- `reaction_type` (ENUM: 'like', 'dislike')
- `reacted_at` (TIMESTAMP, default current time)
- **Constraints:** Either `video_id` or `comment_id` should be non-null, not both.

**5. Subscriptions**
- `subscription_id` (PK, UUID)
- `subscriber_id` (FK to Users)
- `channel_id` (FK to Users)
- `subscribed_at` (TIMESTAMP)
- **Unique:** (`subscriber_id`, `channel_id`)

**6. Playlists**
- `playlist_id` (PK, UUID)
- `user_id` (FK to Users)
- `name` (VARCHAR)
- `description` (TEXT)
- `created_at` (TIMESTAMP)
- `is_public` (BOOLEAN)
- **Indexes:** On `user_id`, `name`

**7. Playlist_Videos**
- `playlist_id` (FK to Playlists)
- `video_id` (FK to Videos)
- `order` (INT)
- **Primary Key:** (`playlist_id`, `video_id`)

**8. Notifications**
- `notification_id` (PK, UUID)
- `user_id` (FK to Users)
- `type` (VARCHAR)
- `message` (TEXT)
- `is_read` (BOOLEAN, default false)
- `created_at` (TIMESTAMP)

**9. Categories**
- `category_id` (PK, UUID)
- `name` (VARCHAR)
- `description` (TEXT)

---

### Additional Considerations:
- Use appropriate foreign key constraints and cascading rules.
- Include indexes on foreign keys for optimized joins.
- Design for scalability with partitioning or horizontal scaling strategies if needed.
- Implement data validation constraints (e.g., ENUMs, NOT NULL, unique constraints).

---

Would you like me to generate an ER diagram, sample SQL create statements, or suggestions for indexing and optimization?