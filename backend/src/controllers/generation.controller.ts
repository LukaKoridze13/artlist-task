import { Request, Response } from "express";
import OpenAI from "openai";
import GenerationModel, {
  GenerationStatus,
  GenerationType,
} from "../models/generation.model";
import { getIO } from "../socket";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function summarizePrompt(prompt: string, maxLength = 60): string {
  const trimmed = prompt.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const ENHANCED_PROMPT_MAX_LENGTH = 400;

export async function enhancePrompt(req: Request, res: Response) {
  try {
    const { prompt, type } = req.body as {
      prompt?: string;
      type?: GenerationType;
    };

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "Prompt is required" });
    }
    if (!type || (type !== "text" && type !== "image")) {
      return res
        .status(400)
        .json({ message: "type must be either 'text' or 'image'" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(503)
        .json({ message: "Prompt enhancement is not configured" });
    }

    const outputKind = type === "image" ? "image" : "text";
    const systemContent = `You are a prompt enhancement assistant. The user is writing a prompt for an AI that will generate ${outputKind}.

Rules:
- Enhance the user's prompt to be clearer, more descriptive, and more effective for ${outputKind} generation.
- Return ONLY the enhanced prompt. No explanations, no comments, no markdown, no quotes. Plain raw text only.
- The enhanced prompt must be at most ${ENHANCED_PROMPT_MAX_LENGTH} characters. If needed, shorten or refine to fit while keeping the meaning.
- Keep the same language as the user's prompt unless they mixed languages.
- Do not add preamble like "Enhanced prompt:" or similar—output nothing but the prompt itself.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: prompt.trim() },
      ],
      max_tokens: 200,
    });

    const raw =
      completion.choices?.[0]?.message?.content?.trim() ?? "";
    const enhanced = raw.slice(0, ENHANCED_PROMPT_MAX_LENGTH);

    return res.status(200).json({ prompt: enhanced });
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message ?? "Failed to enhance prompt",
    });
  }
}

export async function createGeneration(req: Request, res: Response) {
  try {
    const { type, prompt, imageSize, socketId } = req.body as {
      type?: GenerationType;
      prompt?: string;
      imageSize?: string;
      socketId?: string;
    };

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const words = countWords(prompt);
    if (words > 500) {
      return res
        .status(400)
        .json({ message: "Prompt is too long. Maximum is 500 words." });
    }

    if (!type || (type !== "text" && type !== "image")) {
      return res
        .status(400)
        .json({ message: "type must be either 'text' or 'image'" });
    }

    let resolvedImageSize: string | undefined;
    if (type === "image") {
      const allowedSizes = ["1024x1024", "1024x1536", "1536x1024", "auto"];
      if (imageSize && !allowedSizes.includes(imageSize)) {
        return res.status(400).json({
          message:
            "Invalid image size. Allowed values: 1024x1024, 1024x1536, 1536x1024, auto.",
        });
      }
      resolvedImageSize = imageSize || "auto";
    }

    const generation = await GenerationModel.create({
      name: summarizePrompt(prompt),
      prompt,
      type,
      status: "pending" as GenerationStatus,
      imageSize: resolvedImageSize,
      socketId: typeof socketId === "string" ? socketId : undefined,
    });

    void processGeneration(generation.id).catch(() => {
      // errors are handled inside processGeneration
    });

    return res.status(202).json(generation);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create generation job" });
  }
}

export async function listGenerations(req: Request, res: Response) {
  try {
    const {
      page = "1",
      limit = "12",
      type,
      status,
      includeDeleted,
    } = req.query as {
      page?: string;
      limit?: string;
      type?: string;
      status?: string;
      includeDeleted?: string;
    };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);

    const query: Record<string, unknown> = {};
    if (type === "text" || type === "image") {
      query.type = type;
    }
    if (
      status === "pending" ||
      status === "generating" ||
      status === "completed" ||
      status === "failed"
    ) {
      query.status = status;
    }

    if (!includeDeleted || includeDeleted === "false") {
      query.deletedAt = { $exists: false };
    }

    const [items, total] = await Promise.all([
      GenerationModel.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
        .exec(),
      GenerationModel.countDocuments(query),
    ]);

    return res.status(200).json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to list generations" });
  }
}

export async function listRecentGenerations(req: Request, res: Response) {
  try {
    const windowMinutes = parseInt(
      (req.query.windowMinutes as string) || "30",
      10,
    );
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const items = await GenerationModel.find({
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    return res.status(200).json({ items });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to list recent generations" });
  }
}

function toGenerationPayload(doc: any): Record<string, unknown> {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    ...o,
    _id: o._id?.toString?.() ?? o.id,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    startedAt: o.startedAt instanceof Date ? o.startedAt.toISOString() : o.startedAt,
    completedAt: o.completedAt instanceof Date ? o.completedAt.toISOString() : o.completedAt,
  };
}

function emitToSocket(socketId: string | undefined, payload: Record<string, unknown>) {
  const io = getIO();
  if (io && socketId) {
    io.to(socketId).emit("generation:updated", payload);
  }
}

async function processGeneration(id: string) {
  const generation = await GenerationModel.findById(id);
  if (!generation) return;

  if (!process.env.OPENAI_API_KEY) {
    generation.status = "failed";
    generation.errorMessage = "OpenAI API key not configured";
    generation.completedAt = new Date();
    await generation.save();
    emitToSocket(generation.socketId, toGenerationPayload(generation));
    return;
  }

  generation.status = "generating";
  generation.startedAt = new Date();
  await generation.save();
  emitToSocket(generation.socketId, toGenerationPayload(generation));

  try {
    if (generation.type === "text") {
      const response = await openai.responses.create({
        model: "gpt-4o-mini",
        input: generation.prompt,
      });

      const firstOutput = response.output?.[0];
      let output = "";
      if (
        firstOutput &&
        "content" in firstOutput &&
        Array.isArray((firstOutput as any).content) &&
        (firstOutput as any).content[0]?.type === "output_text"
      ) {
        output = (firstOutput as any).content[0].text || "";
      }

      generation.resultText = output || "No content generated.";

      // Ask AI for a short name/title for text generations
      try {
        const titleResponse = await openai.responses.create({
          model: "gpt-4o-mini",
          input: `Prompt: "${generation.prompt}". Generated result: "${generation.resultText}". Give a concise, 3-6 word title without quotes.`,
        });

        const firstTitleOutput = titleResponse.output?.[0];
        let titleText = "";
        if (
          firstTitleOutput &&
          "content" in firstTitleOutput &&
          Array.isArray((firstTitleOutput as any).content) &&
          (firstTitleOutput as any).content[0]?.type === "output_text"
        ) {
          titleText = (firstTitleOutput as any).content[0].text || "";
        }

        if (titleText && typeof titleText === "string") {
          generation.name = summarizePrompt(titleText, 80);
        }
      } catch {
        // if title generation fails, keep the prompt-based name
      }
    } else if (generation.type === "image") {
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: generation.prompt,
        size: (generation.imageSize as any) || "auto",
        n: 1,
      });

      const first = response.data?.[0];
      if (first?.b64_json) {
        generation.resultImageUrl = `data:image/png;base64,${first.b64_json}`;
      } else if ((first as any)?.url) {
        generation.resultImageUrl = (first as any).url || "";
      } else {
        generation.resultImageUrl = "";
      }
    }

    generation.status = "completed";
  } catch (error: any) {
    generation.status = "failed";
    generation.errorMessage =
      error?.message || "Failed to generate content with OpenAI";
  } finally {
    generation.completedAt = new Date();
    await generation.save();
    emitToSocket(generation.socketId, toGenerationPayload(generation));
  }
}
