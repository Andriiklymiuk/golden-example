import { Hono } from "hono";
import { describeRoute } from 'hono-openapi';
import { validator } from 'hono-openapi/zod';
import { z } from "zod";
import { db } from "../db";
import { Recipe } from "../types";

const recipeRoutes = new Hono();

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
  (c) => {
    const userId = c.req.query("userId");
    const searchQuery = c.req.query("q")?.toLowerCase();
    const recipes = Array.from(db.recipes.values());
    let filteredRecipes = recipes;

    if (userId) {
      filteredRecipes = filteredRecipes.filter(
        (recipe) => recipe.userId === userId
      );
    }

    if (searchQuery) {
      filteredRecipes = filteredRecipes.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchQuery) ||
          recipe.ingredients.some((ingredient) =>
            ingredient.toLowerCase().includes(searchQuery)
          )
      );
    }

    return c.json(filteredRecipes);
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
    const data = c.req.valid('json');

    const user = db.users.get(data.userId);
    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    const recipe: Recipe = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.recipes.set(recipe.id, recipe);
    return c.json(recipe, 201);
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
  (c) => {
    const id = c.req.param("id");
    const recipe = db.recipes.get(id);

    if (!recipe) {
      return c.json({ message: "Recipe not found" }, 404);
    }
    return c.json(recipe);
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
    const id = c.req.param("id");
    const recipe = db.recipes.get(id);

    if (!recipe) {
      return c.json({ message: "Recipe not found" }, 404);
    }

    const data = c.req.valid('json');
    const user = db.users.get(data.userId);
    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    const updatedRecipe: Recipe = {
      ...recipe,
      ...data,
      updatedAt: new Date(),
    };

    db.recipes.set(id, updatedRecipe);
    return c.json(updatedRecipe);
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
  (c) => {
    const id = c.req.param("id");
    const recipe = db.recipes.get(id);

    if (!recipe) {
      return c.json({ message: "Recipe not found" }, 404);
    }

    db.recipes.delete(id);
    return c.json({ message: "Recipe deleted successfully" });
  }
);

export { recipeRoutes };