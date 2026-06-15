import { prisma } from "../src/lib/prisma";

async function main() {
  const u = await prisma.user.findFirst({
    where: { byok_google_key_encrypted: { not: null } },
    select: { email: true, preferred_ai_model: true, byok_provider: true },
  });
  console.log(JSON.stringify(u, null, 2));
  await prisma.$disconnect();
}

main();
