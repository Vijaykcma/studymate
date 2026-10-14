import { z } from 'zod';

export const createMaterialSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(120),
  description: z.string().trim().max(500).optional().default(''),
  group: z.string().min(1, 'Group ID is required'),
});
