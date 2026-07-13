/* eslint-disable no-console */
import { PrismaClient, Role, Visibility, TargetType } from "@prisma/client";

const prisma = new PrismaClient();

// Precomputed bcrypt hash of "password123" to make seeding fast
const PRECOMPUTED_PASSWORD_HASH = "$2a$10$e0M24.8.tLp1690t9JigIeX/s1N5HkP8X5cO66KzY9ZfQfDle17Ua";

const DUMMY_FIRST_NAMES = [
  "John", "Sarah", "David", "Emma", "Michael", "Sophia", "James", "Olivia",
  "Robert", "Isabella", "William", "Mia", "Joseph", "Charlotte", "Charles"
];

const DUMMY_LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia",
  "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez"
];

const DUMMY_POST_TEXTS = [
  "Just started a new project today! Super excited to see where this journey takes us. Code is flowing nicely.",
  "Had a wonderful weekend hiking in the mountains. The view at the peak was absolutely breathtaking!",
  "Thinking about the future of web development. Server components, edge functions, and AI integrations are changing everything.",
  "Coffee, code, and classic rock. The perfect combination for a productive Saturday morning.",
  "Just finished reading an incredible book on software architecture. Highly recommend diving into domain-driven design.",
  "Our team just launched the new beta! Check it out and let me know your thoughts.",
  "Beautiful sunset tonight. Sometimes you just need to step away from the screen and appreciate nature.",
  "Spent the morning debugging a single semicolon. We've all been there, right?",
  "Healthy lunch prep for the week ahead! Staying energized is key to staying productive.",
  "A quiet evening at home with a hot cup of tea and some lofi music playing in the background."
];

const DUMMY_COMMENT_TEXTS = [
  "Wow, this is awesome! Congrats!",
  "Absolutely love this. Keep it up!",
  "Great post, thanks for sharing this perspective.",
  "Could not agree more. Well said!",
  "This looks amazing! Where was this taken?",
  "Interesting point. Have you considered the alternative approach?",
  "That sounds like a productive day!",
  "Count me in next time!"
];

const DUMMY_REPLY_TEXTS = [
  "Thanks! Appreciate the support.",
  "Haha exactly!",
  "I was thinking the same thing.",
  "I actually wrote a blog post about that alternative!",
  "It was taken in Yosemite! Highly recommend visiting."
];

const DUMMY_AVATAR_URLS = [
  "/assets/images/chat_profile.png",
  "/assets/images/chat_profile1.png",
  "/assets/images/profile-1.png",
  "/assets/images/people1.png",
  "/assets/images/people2.png",
  "/assets/images/people3.png",
  "/assets/images/Avatar.png",
];

async function main() {
  console.log("🌱 Cleaning up database...");
  await prisma.like.deleteMany({});
  await prisma.replyComment.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.savedPost.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🌱 Seeding database...");

  // 1. Seed 15 Users
  const createdUsers = [];
  // Ensure the default login credentials from before exist
  // testuser@example.com (Test User)
  const defaultTestUser = await prisma.user.create({
    data: {
      email: "testuser@example.com",
      firstName: "Test",
      lastName: "User",
      passwordHash: PRECOMPUTED_PASSWORD_HASH,
      avatarUrl: DUMMY_AVATAR_URLS[0],
      role: Role.USER,
    },
  });
  createdUsers.push(defaultTestUser);

  // Seeding other users
  for (let i = 0; i < 14; i++) {
    const firstName = DUMMY_FIRST_NAMES[i % DUMMY_FIRST_NAMES.length];
    const lastName = DUMMY_LAST_NAMES[i % DUMMY_LAST_NAMES.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: PRECOMPUTED_PASSWORD_HASH,
        avatarUrl: DUMMY_AVATAR_URLS[(i + 1) % DUMMY_AVATAR_URLS.length],
        role: Role.USER,
      },
    });
    createdUsers.push(user);
  }
  console.log(`✅ Seeded ${createdUsers.length} Users.`);

  // 2. Seed 150 Posts
  const createdPosts = [];
  const now = new Date();
  for (let i = 0; i < 150; i++) {
    const author = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const text = DUMMY_POST_TEXTS[Math.floor(Math.random() * DUMMY_POST_TEXTS.length)] + ` (#${i + 1})`;
    
    let imageUrl = null;
    if (Math.random() < 0.25) {
      const imgNum = (i % 10) + 1;
      imageUrl = imgNum === 10 ? "/assets/images/timeline_img.png" : `/assets/images/photos${imgNum}.png`;
    }

    const postDate = new Date(now.getTime() - (150 - i) * 4 * 60 * 60 * 1000); // spread over ~25 days

    const post = await prisma.post.create({
      data: {
        authorId: author.id,
        text,
        imageUrl,
        visibility: Math.random() < 0.9 ? Visibility.PUBLIC : Visibility.PRIVATE,
        createdAt: postDate,
        updatedAt: postDate,
      },
    });
    createdPosts.push(post);
  }
  console.log(`✅ Seeded ${createdPosts.length} Posts.`);

  // 3. Seed ~150 Comments
  const createdComments = [];
  for (let i = 0; i < createdPosts.length; i++) {
    const post = createdPosts[i];
    // Create 0-2 comments per post
    const commentCount = Math.floor(Math.random() * 3);
    for (let c = 0; c < commentCount; c++) {
      const author = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const text = DUMMY_COMMENT_TEXTS[Math.floor(Math.random() * DUMMY_COMMENT_TEXTS.length)];
      const commentDate = new Date(post.createdAt.getTime() + (c + 1) * 30 * 60 * 1000);

      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: author.id,
          text,
          createdAt: commentDate,
          updatedAt: commentDate,
        },
      });
      createdComments.push(comment);
    }
  }
  console.log(`✅ Seeded ${createdComments.length} Comments.`);

  // 4. Seed ~100 Reply Comments
  const createdReplies = [];
  for (let i = 0; i < createdComments.length; i++) {
    const comment = createdComments[i];
    // 40% chance of reply
    if (Math.random() < 0.4) {
      const replyCount = Math.floor(Math.random() * 2) + 1;
      for (let r = 0; r < replyCount; r++) {
        const author = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        const text = DUMMY_REPLY_TEXTS[Math.floor(Math.random() * DUMMY_REPLY_TEXTS.length)];
        const replyDate = new Date(comment.createdAt.getTime() + (r + 1) * 15 * 60 * 1000);

        const reply = await prisma.replyComment.create({
          data: {
            commentId: comment.id,
            authorId: author.id,
            text,
            createdAt: replyDate,
            updatedAt: replyDate,
          },
        });
        createdReplies.push(reply);
      }
    }
  }
  console.log(`✅ Seeded ${createdReplies.length} Replies.`);

  // 5. Seed ~600 Likes
  let likeCount = 0;
  // Post likes
  for (const post of createdPosts) {
    const uniqueLikerIds = new Set<string>();
    const count = Math.floor(Math.random() * 8); // 0-7 likes per post
    while (uniqueLikerIds.size < count) {
      const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      uniqueLikerIds.add(user.id);
    }
    for (const userId of uniqueLikerIds) {
      await prisma.like.create({
        data: {
          userId,
          targetType: TargetType.POST,
          targetId: post.id,
        },
      });
      likeCount++;
    }
  }

  // Comment likes
  for (const comment of createdComments) {
    const uniqueLikerIds = new Set<string>();
    const count = Math.floor(Math.random() * 4); // 0-3 likes per comment
    while (uniqueLikerIds.size < count) {
      const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      uniqueLikerIds.add(user.id);
    }
    for (const userId of uniqueLikerIds) {
      await prisma.like.create({
        data: {
          userId,
          targetType: TargetType.COMMENT,
          targetId: comment.id,
        },
      });
      likeCount++;
    }
  }

  // Reply likes
  for (const reply of createdReplies) {
    const uniqueLikerIds = new Set<string>();
    const count = Math.floor(Math.random() * 3); // 0-2 likes per reply
    while (uniqueLikerIds.size < count) {
      const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      uniqueLikerIds.add(user.id);
    }
    for (const userId of uniqueLikerIds) {
      await prisma.like.create({
        data: {
          userId,
          targetType: TargetType.REPLY_COMMENT,
          targetId: reply.id,
        },
      });
      likeCount++;
    }
  }
  console.log(`✅ Seeded ${likeCount} Likes.`);
  console.log("🌱 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
