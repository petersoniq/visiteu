import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Zadaj platný email'),
  password: z.string().min(6, 'Heslo musí mať aspoň 6 znakov'),
})

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Prezývka musí mať aspoň 3 znaky')
      .max(20, 'Prezývka môže mať max. 20 znakov')
      .regex(/^[a-zA-Z0-9_]+$/, 'Len písmená, čísla a podčiarkovník'),
    email: z.string().email('Zadaj platný email'),
    password: z.string().min(6, 'Heslo musí mať aspoň 6 znakov'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Heslá sa nezhodujú',
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>

export const visitSchema = z.object({
  visit_date: z
    .string()
    .min(1, 'Zadaj dátum návštevy')
    .refine((d) => new Date(d) <= new Date(), 'Dátum nemôže byť v budúcnosti'),
  transport_mode: z.enum(
    ['lietadlo', 'vlak', 'auto', 'autobus', 'bicykel', 'pešo', 'loď', 'iné'],
    { errorMap: () => ({ message: 'Vyber spôsob dopravy' }) }
  ),
  duration_nights: z.coerce
    .number()
    .int('Musí byť celé číslo')
    .min(0, 'Nemôže byť záporné')
    .max(365, 'Príliš veľká hodnota'),
  notes: z.string().max(1000, 'Max. 1000 znakov').optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
})

export type VisitFormData = z.infer<typeof visitSchema>

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Prezývka musí mať aspoň 3 znaky')
    .max(20, 'Prezývka môže mať max. 20 znakov')
    .regex(/^[a-zA-Z0-9_]+$/, 'Len písmená, čísla a podčiarkovník'),
  full_name: z.string().max(80, 'Max. 80 znakov').optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>

export const passwordChangeSchema = z
  .object({
    newPassword: z.string().min(6, 'Heslo musí mať aspoň 6 znakov'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Heslá sa nezhodujú',
    path: ['confirmPassword'],
  })

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>
