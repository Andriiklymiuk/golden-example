import * as z from 'zod'
import { resolver } from 'hono-openapi/zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const CreateUserSchema = UserSchema.pick({
  name: true,
  email: true
})

export const RecipeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1),
  ingredients: z.array(z.string()).min(1),
  instructions: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const CreateRecipeSchema = RecipeSchema.pick({
  userId: true,
  title: true,
  ingredients: true,
  instructions: true
})

export const ErrorResponse = z.object({
  message: z.string()
})

export type User = z.infer<typeof UserSchema>
export type Recipe = z.infer<typeof RecipeSchema>

export const resolvers = {
  User: resolver(UserSchema),
  CreateUser: resolver(CreateUserSchema),
  Recipe: resolver(RecipeSchema),
  CreateRecipe: resolver(CreateRecipeSchema),
  Error: resolver(ErrorResponse)
}