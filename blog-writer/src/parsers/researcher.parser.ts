import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

export const researcherParser = StructuredOutputParser.fromZodSchema(
  z.object({
    topic: z.string(),
    background: z.string().min(100),
    references: z.array(z.object({
      title: z.string(),
      url: z.string().url()
    })).default([])
  }),
);
