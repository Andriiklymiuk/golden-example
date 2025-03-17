import { Hono } from "hono";
import { describeRoute } from 'hono-openapi';
import { validator } from 'hono-openapi/zod';
import { z } from "zod";
import type { DatabaseInterface } from "../db";

const recipeRoutes = new Hono<{
  Variables: {
    db: DatabaseInterface
  }
}>();

const createRecipeSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  ingredients: z.array(z.string()).min(1),
  instructions: z.string().min(1),
});

recipeRoutes.get('/',
  describeRoute({
    summary: 'List recipes',
    description: 'Get a list of all recipes with optional filtering by user ID and search functionality',
    parameters: [
      {
        name: 'userId',
        in: 'query',
        description: 'Filter recipes by user ID',
        required: false,
        schema: { type: 'string', format: 'uuid' }
      },
      {
        name: 'q',
        in: 'query',
        description: 'Search query to filter recipes by title or ingredients',
        required: false,
        schema: { type: 'string' }
      }
    ],
    responses: {
      200: {
        description: 'List of recipes matching the criteria',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  userId: { type: 'string', format: 'uuid' },
                  title: { type: 'string' },
                  ingredients: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  instructions: { type: 'string' },
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
    const userId = c.req.query("userId");
    const searchQuery = c.req.query("q");

    try {
      const recipes = await db.listRecipes({
        userId: userId || undefined,
        searchQuery: searchQuery || undefined
      });

      return c.json(recipes);
    } catch (error) {
      console.error("Error listing recipes:", error);
      return c.json({ message: "Error listing recipes" }, 500);
    }
  }
);

recipeRoutes.post('/',
  describeRoute({
    summary: 'Create recipe',
    description: 'Create a new recipe for a specific user',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['userId', 'title', 'ingredients', 'instructions'],
            properties: {
              userId: {
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174000'
              },
              title: {
                type: 'string',
                minLength: 1,
                example: 'Spaghetti Carbonara'
              },
              ingredients: {
                type: 'array',
                items: { type: 'string' },
                minItems: 1,
                example: ['spaghetti', 'eggs', 'pecorino cheese', 'guanciale']
              },
              instructions: {
                type: 'string',
                minLength: 1,
                example: '1. Cook pasta\n2. Prepare sauce\n3. Mix and serve'
              }
            }
          }
        }
      }
    },
    responses: {
      201: {
        description: 'Recipe created successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                userId: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                ingredients: {
                  type: 'array',
                  items: { type: 'string' }
                },
                instructions: { type: 'string' },
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
  validator('json', createRecipeSchema),
  async (c) => {
    const db = c.get('db');
    const data = c.req.valid('json');

    try {
      const user = await db.getUser(data.userId);
      if (!user) {
        return c.json({ message: "User not found" }, 404);
      }

      const recipe = await db.createRecipe(data);
      return c.json(recipe, 201);
    } catch (error) {
      console.error("Error creating recipe:", error);
      return c.json({ message: "Error creating recipe" }, 500);
    }
  }
);

recipeRoutes.get('/:id',
  describeRoute({
    summary: 'Get recipe',
    description: 'Get a specific recipe by its ID',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'The ID of the recipe to retrieve'
      }
    ],
    responses: {
      200: {
        description: 'Recipe found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                userId: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                ingredients: {
                  type: 'array',
                  items: { type: 'string' }
                },
                instructions: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      404: {
        description: 'Recipe not found',
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
      const recipe = await db.getRecipe(id);

      if (!recipe) {
        return c.json({ message: "Recipe not found" }, 404);
      }

      return c.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      return c.json({ message: "Error fetching recipe" }, 500);
    }
  }
);

recipeRoutes.put('/:id',
  describeRoute({
    summary: 'Update recipe',
    description: 'Update an existing recipe',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'The ID of the recipe to update'
      }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['userId', 'title', 'ingredients', 'instructions'],
            properties: {
              userId: {
                type: 'string',
                format: 'uuid'
              },
              title: {
                type: 'string',
                minLength: 1
              },
              ingredients: {
                type: 'array',
                items: { type: 'string' },
                minItems: 1
              },
              instructions: {
                type: 'string',
                minLength: 1
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Recipe updated successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                userId: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
                ingredients: {
                  type: 'array',
                  items: { type: 'string' }
                },
                instructions: { type: 'string' },
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
        description: 'Recipe or user not found',
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
  validator('json', createRecipeSchema),
  async (c) => {
    const db = c.get('db');
    const id = c.req.param("id");
    const data = c.req.valid('json');

    try {
      const user = await db.getUser(data.userId);
      if (!user) {
        return c.json({ message: "User not found" }, 404);
      }

      const updatedRecipe = await db.updateRecipe(id, data);

      if (!updatedRecipe) {
        return c.json({ message: "Recipe not found" }, 404);
      }

      return c.json(updatedRecipe);
    } catch (error) {
      console.error("Error updating recipe:", error);
      return c.json({ message: "Error updating recipe" }, 500);
    }
  }
);

recipeRoutes.delete('/:id',
  describeRoute({
    summary: 'Delete recipe',
    description: 'Delete an existing recipe',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'The ID of the recipe to delete'
      }
    ],
    responses: {
      200: {
        description: 'Recipe deleted successfully',
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
        description: 'Recipe not found',
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
      const recipe = await db.getRecipe(id);
      if (!recipe) {
        return c.json({ message: "Recipe not found" }, 404);
      }

      const success = await db.deleteRecipe(id);

      if (success) {
        return c.json({ message: "Recipe deleted successfully" });
      } else {
        return c.json({ message: "Failed to delete recipe" }, 500);
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
      return c.json({ message: "Error deleting recipe" }, 500);
    }
  }
);

export { recipeRoutes };