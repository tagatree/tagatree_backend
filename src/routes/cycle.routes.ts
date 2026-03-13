import { Router } from "express";
import {
  getAllCycles,
  getCycleById,
  getActiveCycle,
  createCycle,
  updateCycle,
  deleteCycle,
} from "../controllers/cycle.controller.js";

const router = Router();

router.get("/", getAllCycles);
router.get("/active", getActiveCycle);
router.get("/:id", getCycleById);
router.post("/", createCycle);
router.patch("/:id", updateCycle);
router.delete("/:id", deleteCycle);

export default router;
