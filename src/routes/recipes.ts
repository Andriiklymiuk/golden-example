import { Hono } from "hono";
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

recipeRoutes.get("/", (c) => {
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
});

recipeRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const result = createRecipeSchema.safeParse(body);

  if (!result.success) {
    return c.json({ message: "Invalid input", errors: result.error.errors }, 400);
  }

  const user = db.users.get(result.data.userId);
  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  const recipe: Recipe = {
    id: crypto.randomUUID(),
    ...result.data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  db.recipes.set(recipe.id, recipe);
  return c.json(recipe, 201);
});

recipeRoutes.get("/:id", (c) => {
  const id = c.req.param("id");
  const recipe = db.recipes.get(id);

  if (!recipe) {
    return c.json({ message: "Recipe not found" }, 404);
  }

  return c.json(recipe);
});

recipeRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const recipe = db.recipes.get(id);

  if (!recipe) {
    return c.json({ message: "Recipe not found" }, 404);
  }

  const body = await c.req.json();
  const result = createRecipeSchema.safeParse(body);

  if (!result.success) {
    return c.json({ message: "Invalid input", errors: result.error.errors }, 400);
  }

  const user = db.users.get(result.data.userId);
  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  const updatedRecipe: Recipe = {
    ...recipe,
    ...result.data,
    updatedAt: new Date(),
  };

  db.recipes.set(id, updatedRecipe);
  return c.json(updatedRecipe);
});

recipeRoutes.delete("/:id", (c) => {
  const id = c.req.param("id");
  const recipe = db.recipes.get(id);

  if (!recipe) {
    return c.json({ message: "Recipe not found" }, 404);
  }

  db.recipes.delete(id);
  return c.json({ message: "Recipe deleted successfully" });
});

export { recipeRoutes };