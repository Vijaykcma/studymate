import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().trim().min(3, 'Group name must be at least 3 characters').max(100),
  subject: z.string().trim().min(2, 'Subject is required').max(60),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000),
  maxMembers: z.coerce.number().int().min(2, 'Must allow at least 2 members').max(100, 'Maximum 100 members').default(10),
  skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).default('All Levels'),
  meetingDays: z.array(z.string()).min(1, 'Select at least one meeting day').default(['Monday']),
  meetingTime: z.string().trim().min(1, 'Meeting time is required').default('7:00 PM'),
  location: z.string().trim().min(1, 'Location is required').default('Online'),
  department: z.string().trim().optional().default(''),
  semester: z.string().trim().optional().default(''),
  visibility: z.enum(['public', 'private']).default('public'),
});

export const updateGroupSchema = createGroupSchema.partial();
