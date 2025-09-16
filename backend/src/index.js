import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { PrismaClient } from '@prisma/client';
import dotenv from "dotenv";

import typeDefs from './schema/typeDefs.js';
import resolvers from './schema/resolvers.js';
import { getUser } from './utils/auth.js';

dotenv.config();

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  includeStacktraceInErrorResponses: process.env.NODE_ENV !== "production"
});

// Create prism client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Start server with Prisma database context
try {
  const { url } = await startStandaloneServer(server, {
    listen: {
      port: process.env.PORT || 4000
    },
    context: async ({ req }) => {
      const user = await getUser(req, prisma);

      return {
        prisma,
        user,
      };
    },
  });

  console.log(`GraphQL Server ready at ${url}`);
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}