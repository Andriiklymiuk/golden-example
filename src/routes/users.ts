import { Hono } from "hono";
import { describeRoute } from 'hono-openapi';
import { validator } from 'hono-openapi/zod';
import { z } from "zod";
import { db } from "../db";
import { User } from "../types";

const userRoutes = new Hono();

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
  (c) => {
    const searchQuery = c.req.query("q")?.toLowerCase();
    const users = Array.from(db.users.values());

    if (searchQuery) {
      const filteredUsers = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery) ||
          user.email.toLowerCase().includes(searchQuery)
      );
      return c.json(filteredUsers);
    }
    return c.json(users);
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
    const data = c.req.valid('json');

    const user: User = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.users.set(user.id, user);
    return c.json(user, 201);
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
  (c) => {
    const id = c.req.param("id");
    const user = db.users.get(id);

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }
    return c.json(user);
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
    const id = c.req.param("id");
    const user = db.users.get(id);

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    const data = c.req.valid('json');
    const updatedUser: User = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };

    db.users.set(id, updatedUser);
    return c.json(updatedUser);
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
  (c) => {
    const id = c.req.param("id");
    const user = db.users.get(id);

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    db.users.delete(id);
    return c.json({ message: "User deleted successfully" });
  }
);

export { userRoutes };