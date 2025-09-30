import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

export const writerParser = StructuredOutputParser.fromZodSchema(
  z.object({
    title: z.string(),
    content: z.string(),
  }),
);
