import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { User } from "../types";

const userRoutes = new Hono();

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

userRoutes.get("/", (c) => {
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
});

userRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const result = createUserSchema.safeParse(body);

  if (!result.success) {
    return c.json({ message: "Invalid input", errors: result.error.errors }, 400);
  }

  const user: User = {
    id: crypto.randomUUID(),
    ...result.data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  db.users.set(user.id, user);
  return c.json(user, 201);
});

userRoutes.get("/:id", (c) => {
  const id = c.req.param("id");
  const user = db.users.get(id);

  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  return c.json(user);
});

userRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const user = db.users.get(id);

  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  const body = await c.req.json();
  const result = createUserSchema.safeParse(body);

  if (!result.success) {
    return c.json({ message: "Invalid input", errors: result.error.errors }, 400);
  }

  const updatedUser: User = {
    ...user,
    ...result.data,
    updatedAt: new Date(),
  };

  db.users.set(id, updatedUser);
  return c.json(updatedUser);
});

userRoutes.delete("/:id", (c) => {
  const id = c.req.param("id");
  const user = db.users.get(id);

  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  db.users.delete(id);
  return c.json({ message: "User deleted successfully" });
});

export { userRoutes };