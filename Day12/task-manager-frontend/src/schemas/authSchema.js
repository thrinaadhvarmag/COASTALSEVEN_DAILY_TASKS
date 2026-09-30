import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(1, "Password is required."),
});

export const registerSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, "Username must contain at least 3 characters.")
        .max(50, "Username must contain 50 characters or less."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z
        .string()
        .min(8, "Password must contain at least 8 characters.")
        .max(100, "Password must contain 100 characters or less."),
});
