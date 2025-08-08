import { z } from 'zod';

const createSchema = z.object({

    name: z.string(),

});

const updateSchema = z.object({

    name: z.string().optional(),
    description: z.string().optional(),

});

export const dogValidation = {
createSchema,
updateSchema,
};