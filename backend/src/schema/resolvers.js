import { GraphQLError } from 'graphql';
import {
  hashPassword,
  comparePassword,
  generateToken,
  requireAuth,
  requireAdmin,
  requireOwnership
} from '../utils/auth.js';

const resolvers = {
  Query: {
    // Public queries
    me: (_, __, { user }) => user,

    // Protected queries (authenticated users)
    myNotes: async (_, __, { prisma, user }) => {
      requireAuth(user);

      return await prisma.note.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: 'desc' }
      });
    },

    note: async (_, { id }, { prisma, user }) => {
      requireAuth(user);

      const note = await prisma.note.findUnique({
        where: { id }
      });

      if (!note) {
        throw new GraphQLError('Note not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Check ownership
      requireOwnership(user, note.authorId);

      return note;
    },

    // Admin only queries
    users: async (_, __, { prisma, user }) => {
      requireAdmin(user);
      return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
    },

    user: async (_, { id }, { prisma, user }) => {
      requireAdmin(user);
      const foundUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!foundUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return foundUser;
    },

    allNotes: async (_, __, { prisma, user }) => {
      requireAdmin(user);

      return await prisma.note.findMany({
        orderBy: { createdAt: 'desc' }
      });
    },
  },

  Mutation: {
    // Public mutations (no authentication required)
    register: async (_, { input }, { prisma }) => {
      const { name, email, password } = input;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new GraphQLError('User already exists with this email', {
          extensions: { code: 'USER_EXISTS' }
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        }
      });

      // Generate token
      const token = generateToken(user.id);

      return { token, user };
    },

    login: async (_, { input }, { prisma }) => {
      const { email, password } = input;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'INVALID_CREDENTIALS' }
        });
      }

      // Check password
      const isValid = await comparePassword(password, user.password);

      if (!isValid) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'INVALID_CREDENTIALS' }
        });
      }

      // Generate token
      const token = generateToken(user.id);

      return { token, user };
    },

    // Admin only user management
    createUserByAdmin: async (_, { input }, { prisma, user }) => {
      requireAdmin(user);

      const { name, email, password, role } = input;

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new GraphQLError('User already exists with this email', {
          extensions: { code: 'USER_EXISTS' }
        });
      }

      const hashedPassword = await hashPassword(password);

      return await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || 'USER',
        }
      });
    },

    updateUser: async (_, { id, input }, { prisma, user }) => {
      // Users can update themselves, admins can update anyone
      if (user.id !== id) {
        requireAdmin(user);
      } else {
        requireAuth(user);
      }

      const data = { ...input };

      // Hash password if provided
      if (data.password) {
        data.password = await hashPassword(data.password);
      }

      // Only admins can change roles
      if (data.role && user.role !== 'ADMIN') {
        delete data.role;
      }

      return await prisma.user.update({
        where: { id },
        data
      });
    },

    deleteUser: async (_, { id }, { prisma, user }) => {
      requireAdmin(user);

      await prisma.user.delete({
        where: { id }
      });

      return true;
    },

    // Protected note management
    createNote: async (_, { input }, { prisma, user }) => {
      requireAuth(user);

      return await prisma.note.create({
        data: {
          ...input,
          authorId: user.id,
        }
      });
    },

    updateNote: async (_, { id, input }, { prisma, user }) => {
      requireAuth(user);

      const note = await prisma.note.findUnique({
        where: { id }
      });

      if (!note) {
        throw new GraphQLError('Note not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Check ownership
      requireOwnership(user, note.authorId);

      return await prisma.note.update({
        where: { id },
        data: input
      });
    },

    deleteNote: async (_, { id }, { prisma, user }) => {
      requireAuth(user);

      const note = await prisma.note.findUnique({
        where: { id }
      });

      if (!note) {
        throw new GraphQLError('Note not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Check ownership
      requireOwnership(user, note.authorId);

      await prisma.note.delete({
        where: { id }
      });

      return true;
    },
  },

  // Field resolvers
  User: {
    notes: async ({ id }, _, { prisma }) => {
      return await prisma.note.findMany({
        where: { authorId: id },
        orderBy: { createdAt: 'desc' }
      });
    },
  },

  Note: {
    author: async ({ authorId }, _, { prisma }) => {
      return await prisma.user.findUnique({
        where: { id: authorId }
      });
    },
  },
};

export default resolvers;