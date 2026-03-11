import { Router } from "express";
import {
  cancelGeneration,
  createGeneration,
  enhancePrompt,
  listGenerations,
  listRecentGenerations,
} from "../controllers/generation.controller";
import GenerationModel from "../models/generation.model";

const router = Router();

router.post("/", createGeneration);
router.post("/enhance", enhancePrompt);
router.post("/:id/cancel", cancelGeneration);
router.get("/", listGenerations);
router.get("/recent", listRecentGenerations);
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await GenerationModel.findByIdAndUpdate(id, {
      deletedAt: new Date(),
    });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete generation" });
  }
});

export default router;

