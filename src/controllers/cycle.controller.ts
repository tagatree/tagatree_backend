import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";

export async function getAllCycles(_req: Request, res: Response, next: NextFunction) {
  try {
    const cycles = await prisma.cycle.findMany({ orderBy: { createdAt: "desc" } });
    res.json(cycles.map(formatCycle));
  } catch (err) {
    next(err);
  }
}

export async function getCycleById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const cycle = await prisma.cycle.findUnique({ where: { id } });
    if (!cycle) {
      res.status(404).json({ error: "Cycle not found" });
      return;
    }
    res.json(formatCycle(cycle));
  } catch (err) {
    next(err);
  }
}

export async function getActiveCycle(_req: Request, res: Response, next: NextFunction) {
  try {
    const cycle = await prisma.cycle.findFirst({ where: { active: true } });
    if (!cycle) {
      res.status(404).json({ error: "No active cycle found" });
      return;
    }
    res.json(formatCycle(cycle));
  } catch (err) {
    next(err);
  }
}

export async function createCycle(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, cycleEndDate, capacity, paidCount, active } = req.body as {
      name: string;
      cycleEndDate: string;
      capacity: number;
      paidCount: number;
      active?: boolean;
    };
    const cycle = await prisma.cycle.create({
      data: {
        name,
        cycleEndDate: new Date(cycleEndDate),
        capacity,
        paidCount,
        ...(active !== undefined && { active }),
      },
    });
    res.status(201).json(formatCycle(cycle));
  } catch (err) {
    next(err);
  }
}

export async function updateCycle(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const { name, cycleEndDate, capacity, paidCount, active } = req.body as {
      name?: string;
      cycleEndDate?: string;
      capacity?: number;
      paidCount?: number;
      active?: boolean;
    };
    const cycle = await prisma.cycle.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(cycleEndDate && { cycleEndDate: new Date(cycleEndDate) }),
        ...(capacity !== undefined && { capacity }),
        ...(paidCount !== undefined && { paidCount }),
        ...(active !== undefined && { active }),
      },
    });
    res.json(formatCycle(cycle));
  } catch (err) {
    next(err);
  }
}

export async function deleteCycle(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    await prisma.cycle.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

function formatCycle(cycle: {
  id: string;
  name: string;
  cycleEndDate: Date;
  capacity: number;
  paidCount: number;
  active: boolean;
  updatedAt: Date;
}) {
  return {
    cycle_id: cycle.id,
    name: cycle.name,
    cycle_end_date: cycle.cycleEndDate.toISOString().split("T")[0],
    capacity: cycle.capacity,
    paid_count: cycle.paidCount,
    remaining: cycle.capacity - cycle.paidCount,
    active: cycle.active,
    updated_at: cycle.updatedAt.toISOString(),
  };
}
