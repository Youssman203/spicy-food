import { z } from 'zod';
import { normalizePhone } from './security.js';
const text = (max, min = 1) => z.string().trim().min(min).max(max);
export const phone = text(32).transform(normalizePhone).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, 'Numéro WhatsApp invalide (ex. 0977105688).'));
const httpUrl = z.string().trim().max(2048).refine(v => !v || /^https:\/\//i.test(v) && URL.canParse(v), 'URL HTTPS requise.');
export const loginSchema = z.object({ email: z.email().max(254).transform(v => v.toLowerCase()), password: z.string().min(1).max(128) }).strict();
export const passwordSchema = z.string().min(12, 'Choisissez au moins 12 caractères.').max(128).refine(v => v.trim().length >= 12, 'Utilisez au moins 12 caractères hors espaces de début et de fin.');
export const adminUpdateSchema = z.object({ name: text(100), email: z.string().trim().pipe(z.email().max(254)).transform(v => v.toLowerCase()), role: z.enum(['admin','super_admin']), is_active: z.boolean() }).strict();
export const adminSchema = adminUpdateSchema.omit({is_active:true}).extend({role:z.enum(['admin','super_admin']).default('admin'),password:passwordSchema}).strict();
export const resetPasswordSchema = z.object({password:passwordSchema}).strict();
export const changePasswordSchema = resetPasswordSchema.extend({current_password:z.string().min(1).max(128)}).strict();
export const menuSchema = z.object({
 name: text(120), description: text(1500, 0), price: z.number().positive().max(10000000).multipleOf(0.01),
 category: z.enum(['tacos','sandwichs','combos','boissons']), image_url: z.union([httpUrl,z.string().regex(/^\/api\/media\/[a-f0-9-]{36}\.webp$/)]),
 spiciness_level: z.enum(['Doux','Moyen','Fiery']), is_available: z.boolean(),
 variants: z.array(z.object({ name: text(30), price: z.number().positive().max(10000000).multipleOf(0.01) }).strict()).min(1).max(6),
}).strict().refine(v => new Set(v.variants.map(x => x.name)).size === v.variants.length && v.variants[0].price === v.price, 'Les portions doivent être uniques ; le prix principal doit correspondre à la première portion.');
export const orderSchema = z.object({
 request_key: z.uuid(), client: z.object({first_name: text(80), last_name: text(80), phone}).strict(),
 delivery_address: text(1000, 5), location: z.enum(['Lubumbashi','Kolwezi']), note: text(500, 0).default(''),
 items: z.array(z.object({id: z.number().int().positive(), size: text(30), heat: z.enum(['','Doux','Moyen','Fiery']), quantity: z.number().int().min(1).max(99)}).strict()).min(1).max(50),
}).strict();
export const settingsSchema = z.object({ infoline_phone: phone, instagram_url: httpUrl.refine(v => !!v), instagram_handle: text(80), tiktok_url: httpUrl.default(''), site_notice: text(300, 0) }).strict();
export function parse(schema, body) {
 const result = schema.safeParse(body);
 if (!result.success) { const error = new Error(result.error.issues.map(i => `${i.path.join('.') || 'Formulaire'} : ${i.message}`).join(' ')); error.status = 400; throw error; }
 return result.data;
}
export function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
export function idParam(value) { const id = Number(value); if (!Number.isSafeInteger(id) || id <= 0) fail(400, 'Identifiant invalide.'); return id; }
