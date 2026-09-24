import { z } from "zod";

export const DateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)");
export const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido (HH:MM)");
