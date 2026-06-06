import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export const alarmSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(100),
  description: z.string().max(500).optional(),
  date: z.string().min(1, 'Data obrigatória'),
  time: z.string().min(1, 'Hora obrigatória'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type AlarmInput = z.infer<typeof alarmSchema>;
