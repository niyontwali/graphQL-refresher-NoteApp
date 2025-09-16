import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new GraphQLError('Invalid or expired token', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
};

export const getUser = async (req, prisma) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  try {
    const { userId } = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    return user;
  } catch (error) {
    return null;
  }
};

export const requireAuth = (user) => {
  if (!user) {
    throw new GraphQLError('You must be logged in to perform this action', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return user;
};

export const requireAdmin = (user) => {
  requireAuth(user);
  if (user.role !== 'ADMIN') {
    throw new GraphQLError('You must be an admin to perform this action', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
  return user;
};

export const requireOwnership = (user, resourceUserId) => {
  requireAuth(user);
  if (user.id !== resourceUserId && user.role !== 'ADMIN') {
    throw new GraphQLError('You can only access your own resources', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
  return user;
};