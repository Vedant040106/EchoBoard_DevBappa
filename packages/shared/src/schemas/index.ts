import { z } from 'zod';
import {
  ROLES,
  PREDEFINED_DEPARTMENTS,
  NOTE_COLORS,
  PIN_VARIANTS,
  NOTE_SIZES,
  FIELD_LIMITS,
  DOODLE_TYPES,
} from '../constants/index.js';

export const roleSchema = z.enum(ROLES);

export const predefinedDepartmentSchema = z.enum(PREDEFINED_DEPARTMENTS);

export const noteColorSchema = z.enum(NOTE_COLORS);
export const pinVariantSchema = z.enum(PIN_VARIANTS);
export const noteSizeSchema = z.enum(NOTE_SIZES);
export const doodleTypeSchema = z.enum(DOODLE_TYPES);

export const feedbackSubmissionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(FIELD_LIMITS.NAME_MIN, `Name must be at least ${FIELD_LIMITS.NAME_MIN} characters`)
      .max(FIELD_LIMITS.NAME_MAX, `Name cannot exceed ${FIELD_LIMITS.NAME_MAX} characters`),
    role: roleSchema,
    department: predefinedDepartmentSchema.optional(),
    departmentOther: z
      .string()
      .trim()
      .max(FIELD_LIMITS.DEPARTMENT_OTHER_MAX)
      .optional()
      .or(z.literal('')),
    designation: z
      .string()
      .trim()
      .max(FIELD_LIMITS.DESIGNATION_MAX)
      .optional()
      .or(z.literal('')),
    institutionName: z
      .string()
      .trim()
      .max(FIELD_LIMITS.INSTITUTION_MAX)
      .optional()
      .or(z.literal('')),
    message: z
      .string()
      .trim()
      .min(FIELD_LIMITS.MESSAGE_MIN, `Feedback must be at least ${FIELD_LIMITS.MESSAGE_MIN} characters`)
      .max(FIELD_LIMITS.MESSAGE_MAX, `Feedback cannot exceed ${FIELD_LIMITS.MESSAGE_MAX} characters`),
    confirmedDisplayName: z
      .string()
      .trim()
      .max(FIELD_LIMITS.NAME_MAX)
      .optional(),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(128),
    colorVariant: noteColorSchema.optional(),
    rating: z.coerce
      .number()
      .int()
      .min(FIELD_LIMITS.RATING_MIN, `Rating must be at least ${FIELD_LIMITS.RATING_MIN}`)
      .max(FIELD_LIMITS.RATING_MAX, `Rating cannot exceed ${FIELD_LIMITS.RATING_MAX}`)
      .default(5),
    doodleType: doodleTypeSchema.default('check'),
    eventId: z
      .string()
      .uuid('Event ID must be a valid UUID')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'Student' || data.role === 'Faculty') {
      if (!data.department) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['department'],
          message: 'Department is required for ' + data.role,
        });
      } else if (data.department === 'Other') {
        const otherVal = data.departmentOther?.trim();
        if (!otherVal || otherVal.length < FIELD_LIMITS.DEPARTMENT_OTHER_MIN) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['departmentOther'],
            message: `Please specify your department (at least ${FIELD_LIMITS.DEPARTMENT_OTHER_MIN} characters)`,
          });
        }
      }
    }

    if (data.role === 'Faculty') {
      const designationVal = data.designation?.trim();
      if (!designationVal || designationVal.length < FIELD_LIMITS.DESIGNATION_MIN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['designation'],
          message: `Designation is required for Faculty (e.g., Professor, HOD, Assistant Professor)`,
        });
      }
    }

    if (data.role === 'Other Visitor') {
      const instVal = data.institutionName?.trim();
      if (!instVal || instVal.length < FIELD_LIMITS.INSTITUTION_MIN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['institutionName'],
          message: `Institution or Organization name is required for Other Visitors`,
        });
      }
    }
  });

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;

export const adminLoginSchema = z.object({
  adminId: z.string().trim().min(2, 'Admin ID is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const historyQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: roleSchema.optional(),
  eventId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;

export const adminFeedbackQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: roleSchema.optional(),
  status: z.enum(['all', 'visible', 'hidden', 'deleted']).default('all'),
  eventId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdminFeedbackQueryInput = z.infer<typeof adminFeedbackQuerySchema>;

export const layoutUpdateSchema = z.object({
  world_x: z.number().optional(),
  world_y: z.number().optional(),
  rotation: z.number().min(-45).max(45).optional(),
  layer_order: z.number().int().optional(),
});

export type LayoutUpdateInput = z.infer<typeof layoutUpdateSchema>;

export const createEventSchema = z.object({
  name: z
    .string()
    .trim()
    .min(FIELD_LIMITS.EVENT_NAME_MIN, `Event name must be at least ${FIELD_LIMITS.EVENT_NAME_MIN} characters`)
    .max(FIELD_LIMITS.EVENT_NAME_MAX, `Event name cannot exceed ${FIELD_LIMITS.EVENT_NAME_MAX} characters`),
  eventDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be in YYYY-MM-DD format'),
  venue: z
    .string()
    .trim()
    .min(FIELD_LIMITS.VENUE_MIN, `Venue must be at least ${FIELD_LIMITS.VENUE_MIN} characters`)
    .max(FIELD_LIMITS.VENUE_MAX, `Venue cannot exceed ${FIELD_LIMITS.VENUE_MAX} characters`),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  isDisplayedOnWall: z.boolean().default(true),
  isAcceptingFeedback: z.boolean().default(true),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z.object({
  name: z
    .string()
    .trim()
    .min(FIELD_LIMITS.EVENT_NAME_MIN)
    .max(FIELD_LIMITS.EVENT_NAME_MAX)
    .optional(),
  eventDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be in YYYY-MM-DD format')
    .optional(),
  venue: z
    .string()
    .trim()
    .min(FIELD_LIMITS.VENUE_MIN)
    .max(FIELD_LIMITS.VENUE_MAX)
    .optional(),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  isDisplayedOnWall: z.boolean().optional(),
  isAcceptingFeedback: z.boolean().optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const wallSelectionSchema = z.object({
  eventIds: z.array(z.string().uuid('Each item must be a valid event UUID')),
});

export type WallSelectionInput = z.infer<typeof wallSelectionSchema>;
