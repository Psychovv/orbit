import type { DateRange } from "@/shared/lib/date-utils";
import type {
  CreateHabitInput,
  Habit,
  HabitCheckin,
  UpdateHabitInput,
  UpsertHabitCheckinInput,
} from "../domain/habit.schema";

export interface HabitsRepository {
  list(includeArchived?: boolean): Promise<Habit[]>;
  create(input: CreateHabitInput): Promise<Habit>;
  update(id: string, patch: UpdateHabitInput): Promise<Habit>;
  remove(id: string): Promise<void>;
}

export interface HabitCheckinsRepository {
  list(range: DateRange): Promise<HabitCheckin[]>;
  upsert(input: UpsertHabitCheckinInput): Promise<HabitCheckin | null>;
}
