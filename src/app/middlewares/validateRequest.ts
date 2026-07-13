import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

/**
 * Validate the incoming request against a Zod schema and **replace**
 * req.body / req.query / req.params with the sanitised output.
 *
 * Unknown fields are rejected (Zod `.strict()`) and emails are
 * normalised (trim + lowercase) by the schema's transforms.
 */
const validateRequest =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies,
    });

    if (!result.success) {
      return next(result.error);
    }

    // Assign the parsed (and sanitised) data back to the request.
    // Unknown fields have been stripped by the schema.
    const data = result.data as Record<string, unknown>;
    const hasParsedKey = (key: string) => Object.prototype.hasOwnProperty.call(data, key);

    if (hasParsedKey("body")) {
      req.body = data.body ?? {};
    }
    if (hasParsedKey("query")) {
      Object.defineProperty(req, "query", {
        value: data.query ?? {},
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    if (hasParsedKey("params")) {
      Object.defineProperty(req, "params", {
        value: data.params ?? {},
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    next();
  };

export const RequestValidation = {
  validateRequest,
};
