import { NextRequest, NextResponse } from "next/server";
import { handle, readJson } from "@/infrastructure/auth/guard";
import { getPrisma } from "@/infrastructure/prisma";
import { verifyPassword } from "@/infrastructure/auth/crypto";
import { signToken } from "@/infrastructure/auth/jwt";
import { parseLogin } from "@/application/records";
import { isAppRole } from "@/application/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handle(async () => {
    const { email, password } = parseLogin(await readJson(req));
    const user = await getPrisma().user.findUnique({ where: { email } });
    if (!user || !isAppRole(user.role) || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "El correo o la contraseña no son válidos." }, { status: 401 });
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  });
}
