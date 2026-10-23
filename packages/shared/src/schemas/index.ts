import { z } from 'zod';
import {
  ROLES,
  PREDEFINED_DEPARTMENTS,
  NOTE_COLORS,
  PIN_VARIANTS,
  NOTE_SIZES,
  FIELD_LIMITS,
} from '../constants/index.js';

export const roleSchema = z.enum(ROLES);

export const predefinedDepartmentSchema = z.enum(PREDEFINED_DEPARTMENTS);

export const noteColorSchema = z.enum(NOTE_COLORS);
export const pinVariantSchema = z.enum(PIN_VARIANTS);
export const noteSizeSchema = z.enum(NOTE_SIZES);

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
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;

export const adminFeedbackQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: roleSchema.optional(),
  status: z.enum(['all', 'visible', 'hidden', 'deleted']).default('all'),
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
