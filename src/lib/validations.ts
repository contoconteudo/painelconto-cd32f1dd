/**
 * Validações centralizadas para todos os formulários do sistema.
 * Alinhadas com o schema real do Supabase.
 */

import { z } from "zod";
import { LeadStatus, ClientStatus, ObjectiveStatus } from "@/types";

// Constantes de limites
export const VALIDATION_LIMITS = {
  NAME_MAX: 100,
  COMPANY_MAX: 100,
  EMAIL_MAX: 255,
  PHONE_MAX: 20,
  NOTES_MAX: 1000,
  DESCRIPTION_MAX: 500,
  SEGMENT_MAX: 50,
  VALUE_MIN: 0,
  VALUE_MAX: 999999999,
  NPS_MIN: 0,
  NPS_MAX: 10,
} as const;

// Regex para validações
const PHONE_REGEX = /^[\d\s\-()+ ]{8,20}$/;

// Schema para Lead (alinhado com banco)
export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(VALIDATION_LIMITS.NAME_MAX, `Nome deve ter no máximo ${VALIDATION_LIMITS.NAME_MAX} caracteres`),
  company: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.COMPANY_MAX, `Empresa deve ter no máximo ${VALIDATION_LIMITS.COMPANY_MAX} caracteres`)
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(VALIDATION_LIMITS.EMAIL_MAX, `Email deve ter no máximo ${VALIDATION_LIMITS.EMAIL_MAX} caracteres`)
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.PHONE_MAX, `Telefone deve ter no máximo ${VALIDATION_LIMITS.PHONE_MAX} caracteres`)
    .refine((val) => !val || PHONE_REGEX.test(val), "Telefone inválido")
    .optional()
    .or(z.literal("")),
  value: z
    .number()
    .min(VALIDATION_LIMITS.VALUE_MIN, "Valor não pode ser negativo")
    .max(VALIDATION_LIMITS.VALUE_MAX, "Valor muito alto")
    .optional(),
  source: z
    .string()
    .max(50, "Origem deve ter no máximo 50 caracteres")
    .optional()
    .or(z.literal("")),
  status: z.enum([
    "novo",
    "contato",
    "reuniao_agendada",
    "reuniao_feita",
    "proposta",
    "negociacao",
    "ganho",
    "perdido",
  ] as const),
  notes: z
    .string()
    .max(VALIDATION_LIMITS.NOTES_MAX, `Notas devem ter no máximo ${VALIDATION_LIMITS.NOTES_MAX} caracteres`)
    .optional()
    .or(z.literal("")),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// Schema para Cliente (alinhado com banco)
export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome do contato é obrigatório")
    .max(VALIDATION_LIMITS.NAME_MAX, `Nome deve ter no máximo ${VALIDATION_LIMITS.NAME_MAX} caracteres`),
  company: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.COMPANY_MAX, `Empresa deve ter no máximo ${VALIDATION_LIMITS.COMPANY_MAX} caracteres`)
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(VALIDATION_LIMITS.EMAIL_MAX, `Email deve ter no máximo ${VALIDATION_LIMITS.EMAIL_MAX} caracteres`)
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.PHONE_MAX, `Telefone deve ter no máximo ${VALIDATION_LIMITS.PHONE_MAX} caracteres`)
    .optional()
    .or(z.literal("")),
  segment: z
    .string()
    .max(VALIDATION_LIMITS.SEGMENT_MAX, `Segmento deve ter no máximo ${VALIDATION_LIMITS.SEGMENT_MAX} caracteres`)
    .optional()
    .or(z.literal("")),
  status: z.enum(["ativo", "inativo", "churn"] as const),
  monthly_value: z
    .number()
    .min(VALIDATION_LIMITS.VALUE_MIN, "Valor deve ser positivo")
    .max(VALIDATION_LIMITS.VALUE_MAX, "Valor muito alto")
    .optional(),
  contract_start: z.string().optional().or(z.literal("")),
  notes: z
    .string()
    .max(VALIDATION_LIMITS.NOTES_MAX, `Notas devem ter no máximo ${VALIDATION_LIMITS.NOTES_MAX} caracteres`)
    .optional()
    .or(z.literal("")),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Schema para Objetivo (alinhado com banco)
export const objectiveSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Título é obrigatório")
    .max(VALIDATION_LIMITS.NAME_MAX, `Título deve ter no máximo ${VALIDATION_LIMITS.NAME_MAX} caracteres`),
  description: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX, `Descrição deve ter no máximo ${VALIDATION_LIMITS.DESCRIPTION_MAX} caracteres`)
    .optional()
    .or(z.literal("")),
  category: z
    .string()
    .max(50, "Categoria deve ter no máximo 50 caracteres")
    .optional()
    .or(z.literal("")),
  target_value: z
    .number()
    .positive("Valor deve ser maior que zero")
    .max(VALIDATION_LIMITS.VALUE_MAX, "Valor muito alto")
    .optional(),
  unit: z.string().default("%"),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
});

export type ObjectiveFormData = z.infer<typeof objectiveSchema>;

// Schema para registro de NPS (alinhado com banco)
export const npsRecordSchema = z.object({
  score: z
    .number()
    .int("Nota deve ser um número inteiro")
    .min(VALIDATION_LIMITS.NPS_MIN, "Nota mínima é 0")
    .max(VALIDATION_LIMITS.NPS_MAX, "Nota máxima é 10"),
  feedback: z
    .string()
    .max(VALIDATION_LIMITS.NOTES_MAX, `Feedback deve ter no máximo ${VALIDATION_LIMITS.NOTES_MAX} caracteres`)
    .optional()
    .or(z.literal("")),
});

export type NPSRecordFormData = z.infer<typeof npsRecordSchema>;

// Schema para registro de progresso (alinhado com banco)
export const progressLogSchema = z.object({
  value: z
    .number()
    .min(0, "Valor não pode ser negativo")
    .max(VALIDATION_LIMITS.VALUE_MAX, "Valor muito alto"),
  notes: z
    .string()
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX, `Notas devem ter no máximo ${VALIDATION_LIMITS.DESCRIPTION_MAX} caracteres`)
    .optional()
    .or(z.literal("")),
});

export type ProgressLogFormData = z.infer<typeof progressLogSchema>;
