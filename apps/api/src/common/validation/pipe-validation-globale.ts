import { ValidationPipe } from '@nestjs/common';
import { exceptionRefusForme } from '../errors/traduire-refus-forme.js';

/** Pipe global : whitelist, forbidNonWhitelisted, transform, refus dans la structure commune. */
export function creerPipeValidationGlobale(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: exceptionRefusForme,
  });
}
