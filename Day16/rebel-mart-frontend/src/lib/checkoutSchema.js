import { z } from "zod";

export const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(100, "Name is too long"),
  phone: z.string().trim().regex(/^[0-9+\- ]{10,15}$/, "Enter a valid phone number"),
  address: z.string().trim().min(5, "Enter your delivery address").max(250, "Address is too long"),
  city: z.string().trim().min(2, "Enter your city").max(80, "City is too long"),
  state: z.string().trim().min(2, "Enter your state").max(80, "State is too long"),
  pincode: z.string().trim().regex(/^[0-9]{6,10}$/, "Enter a valid pincode"),
  delivery_instructions: z.string().trim().max(250, "Delivery instructions are too long").optional().or(z.literal("")),
});

export const checkoutDefaults = {
  customer_name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  delivery_instructions: "",
};
