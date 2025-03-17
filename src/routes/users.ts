import { Hono } from "hono";
import { describeRoute } from 'hono-openapi';
import { validator } from 'hono-openapi/zod';
import { z } from "zod";
import type { DatabaseInterface } from "../db";

const userRoutes = new Hono<{
  Variables: {
    db: DatabaseInterface
  }
}>();

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

userRoutes.get('/',
  describeRoute({
    summary: 'List users',
    description: 'Get a list of all users with optional search functionality',
    parameters: [
      {
        name: 'q',
        in: 'query',
        description: 'Search query to filter users by name or email',
        required: false,
        schema: { type: 'string' }
      }
    ],
    responses: {
      200: {
        description: 'List of users matching the criteria',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  }),
  async (c) => {
    const db = c.get('db');
    const searchQuery = c.req.query("q");

    try {
      const users = await db.listUsers();

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const filteredUsers = users.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );
        return c.json(filteredUsers);
      }

      return c.json(users);
    } catch (error) {
      console.error("Error listing users:", error);
      return c.json({ message: "Error listing users" }, 500);
    }
  }
);

userRoutes.post('/',
  describeRoute({
    summary: 'Create user',
    description: 'Create a new user with the provided information',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: {
                type: 'string',
                minLength: 1,
                example: 'John Doe'
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'john@example.com'
              }
            }
          }
        }
      }
    },
    responses: {
      201: {
        description: 'User created successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      400: {
        description: 'Invalid input provided',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                errors: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }),
  validator('json', createUserSchema),
  async (c) => {
    const db = c.get('db');
    const data = c.req.valid('json');

    try {
      const user = await db.createUser(data);
      return c.json(user, 201);
    } catch (error) {
      console.error("Error creating user:", error);
      return c.json({ message: "Error creating user" }, 500);
    }
  }
);

userRoutes.get('/:id',
  describeRoute({
    summary: 'Get user',
    description: 'Get a specific user by their ID',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'The ID of the user to retrieve'
      }
    ],
    responses: {
      200: {
        description: 'User found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }),
  async (c) => {
    const db = c.get('db');
    const id = c.req.param("id");

    try {
      const user = await db.getUser(id);

      if (!user) {
        return c.json({ message: "User not found" }, 404);
      }

      return c.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return c.json({ message: "Error fetching user" }, 500);
    }
  }
);

userRoutes.put('/:id',
  describeRoute({
    summary: 'Update user',
    description: 'Update an existing user\'s information',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'The ID of the user to update'
      }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: {
                type: 'string',
                minLength: 1,
                example: 'John Doe'
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'john@example.com'
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'User updated successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      400: {
        description: 'Invalid input provided',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                errors: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }),
  validator('json', createUserSchema),
  async (c) => {
    const db = c.get('db');
    const id = c.req.param("id");
    const data = c.req.valid('json');

    try {
      const updatedUser = await db.updateUser(id, data);

      if (!updatedUser) {
        return c.json({ message: "User not found" }, 404);
      }

      return c.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      return c.json({ message: "Error updating user" }, 500);
    }
  }
);

userRoutes.delete('/:id',
  describeRoute({
    summary: 'Delete user',
    description: 'Delete an existing user',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'The ID of the user to delete'
      }
    ],
    responses: {
      200: {
        description: 'User deleted successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' }
              }
            }
          }
        }
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }),
  async (c) => {
    const db = c.get('db');
    const id = c.req.param("id");

    try {
      const user = await db.getUser(id);
      if (!user) {
        return c.json({ message: "User not found" }, 404);
      }

      const success = await db.deleteUser(id);

      if (success) {
        return c.json({ message: "User deleted successfully" });
      } else {
        return c.json({ message: "Failed to delete user" }, 500);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      return c.json({ message: "Error deleting user" }, 500);
    }
  }
);

export { userRoutes };