import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { RegisterInput } from "../schemas/auth.schema";

export const registerUser = async (input: RegisterInput) => {
  const { name, email, password } = input;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return user;
};
