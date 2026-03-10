import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import UserModel from "../models/user.model";

export async function registerUser(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "username and password are required" });
    }

    const normalizedEmail = email?.toLowerCase().trim();

    const existingByUsername = await UserModel.findOne({ username });

    if (existingByUsername) {
      return res.status(409).json({ message: "Username already taken" });
    }

    if (normalizedEmail) {
      const existingByEmail = await UserModel.findOne({
        email: normalizedEmail,
      });
      if (existingByEmail) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await UserModel.create(
      normalizedEmail
        ? {
            username,
            email: normalizedEmail,
            passwordHash,
            provider: "credentials",
          }
        : {
            username,
            passwordHash,
            provider: "credentials",
          },
    );

    return res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      provider: user.provider,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Failed to register user" });
  }
}

export async function loginWithCredentials(req: Request, res: Response) {
  try {
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "username and password are required" });
    }

    const user = await UserModel.findOne({ username, provider: "credentials" });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      provider: user.provider,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to authenticate user" });
  }
}

export async function upsertOAuthUser(req: Request, res: Response) {
  try {
    const { email, username, provider } = req.body as {
      email?: string;
      username?: string;
      provider?: string;
    };

    if (!email || !provider) {
      return res
        .status(400)
        .json({ message: "email and provider are required" });
    }

    const normalizedEmail = email.toLowerCase();

    let user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      user = await UserModel.create({
        email: normalizedEmail,
        username: username || normalizedEmail.split("@")[0],
        provider,
      });
    }

    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      provider: user.provider,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to upsert OAuth user" });
  }
}
