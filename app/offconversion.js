import { cookies, headers } from "next/headers";
import { COOKIE_CONSENTIMENTO, OFFCONVERSION, lerConsentimento } from "../lib/consentimento";

// Script do OffConversion, para as páginas públicas que o querem (landing page e
// política de privacidade). Só sai para quem aceitou os cookies de Publicidade.
// O React leva-o sozinho para o <head>.
export default async function OffConversion() {
  const consentimento = lerConsentimento((await cookies()).get(COOKIE_CONSENTIMENTO)?.value);
  if (!consentimento?.publicidade) return null;
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <script
      async
      src={OFFCONVERSION.src}
      data-id={OFFCONVERSION.id}
      data-consent-mode="auto"
      data-forms="true"
      nonce={nonce}
    />
  );
}
