import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  group: z.string().min(1, 'Group ID is required'),
  description: z.string().trim().max(500).optional().default(''),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().trim().min(1, 'Location or meeting link is required').default('Online (Google Meet)'),
  meetingType: z.enum(['Online', 'Campus', 'In-Person']).default('Online'),
  meetingLink: z.string().trim().optional().default(''),
});

export const updateSessionSchema = createSessionSchema.partial();
