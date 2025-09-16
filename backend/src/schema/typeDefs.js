const typeDefs = `#graphql

enum Role {
  USER
  ADMIN
}

type User {
  id: ID!
  name: String!
  email: String!
  role: Role!
  notes: [Note!]!
  createdAt: String!
  updatedAt: String!
}

type Note {
  id: ID!
  title: String!
  description: String!
  author: User!
  createdAt: String!
  updatedAt: String!
}

type AuthPayload {
  token: String!
  user: User!
}

type Query {
  # Public queries
  me: User
  
  # Protected queries (authenticated users)
  myNotes: [Note!]!
  note(id: ID!): Note
  
  # Admin only queries
  users: [User!]!
  user(id: ID!): User
  allNotes: [Note!]!
}

type Mutation {
  # Public mutations (no authentication required)
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  
  # Admin only user management
  createUserByAdmin(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  
  # Protected note management (authenticated users)
  createNote(input: CreateNoteInput!): Note!
  updateNote(id: ID!, input: UpdateNoteInput!): Note!
  deleteNote(id: ID!): Boolean!
}

input RegisterInput {
  name: String!
  email: String!
  password: String!
}

input LoginInput {
  email: String!
  password: String!
}

input CreateUserInput {
  name: String!
  email: String!
  password: String!
  role: Role = USER
}

input UpdateUserInput {
  name: String
  email: String
  password: String
  role: Role
}

input CreateNoteInput {
  title: String!
  description: String!
}

input UpdateNoteInput {
  title: String
  description: String
}
`;

export default typeDefs;