/**
 * Purpose:
 * Terms route: the plain rules for using PixelHB.
 */
import { termsMetadata } from "@/content/metadata";
import { TermsScreen } from "@/features/site/components/TermsScreen";

export const metadata = termsMetadata;

export default function TermsPage() {
  return <TermsScreen />;
}
