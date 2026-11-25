import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getPrisma } from "@/infrastructure/prisma";
import { verifyToken } from "@/infrastructure/auth/jwt";
import { can, type Action } from "@/application/permissions";
import { InputError, LookupError } from "@/application/input-error";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type RouteContext = {
  params: Promise<Record<string, string>>;
};

type AuthenticatedHandler = (
  req: NextRequest,
  user: AuthUser,
  context: RouteContext
) => Promise<NextResponse>;

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new InputError("El cuerpo de la solicitud no es JSON válido.");
  }
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function handle(action: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof InputError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof LookupError) {
      return jsonError(error.message, 404);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return jsonError("Ya existe un registro con esos datos.", 409);
      if (error.code === "P2025") return jsonError("El registro no existe.", 404);
      if (error.code === "P2003") {
        return jsonError("El registro está en uso y no se puede borrar.", 409);
      }
    }
    console.error(error instanceof Error ? error.name : "error");
    return jsonError("No se ha podido completar la operación.", 500);
  }
}

/**
 * Comprueba el token y vuelve a leer el usuario en base.
 * El rol de la petición se decide con el permiso de la acción.
 */
export function withAuth(action: Action, handler: AuthenticatedHandler) {
  return async (req: NextRequest, context: RouteContext): Promise<NextResponse> => {
    const header = req.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) {
      return jsonError("La sesión no es válida.", 401);
    }

    const payload = verifyToken(header.slice("Bearer ".length).trim());
    if (!payload) {
      return jsonError("La sesión no es válida.", 401);
    }

    try {
      const dbUser = await getPrisma().user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, name: true, role: true },
      });
      if (!dbUser || dbUser.email !== payload.email) {
        return jsonError("La sesión no es válida.", 401);
      }
      if (!can(dbUser.role, action)) {
        return jsonError("No tienes permiso para esta acción.", 403);
      }
      return await handler(req, dbUser, context);
    } catch (error) {
      return handle(async () => {
        throw error;
      });
    }
  };
}
