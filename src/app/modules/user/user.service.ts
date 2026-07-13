import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import prisma from "../../../lib/prisma";

function getAvatarUrl(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const avatarNum = Math.abs(hash % 7) + 1;
  return `/assets/images/chat${avatarNum}_img.png`;
}

const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  return {
    ...user,
    avatarUrl: getAvatarUrl(user.id),
  };
};

export const UserService = {
  getUserById,
};
