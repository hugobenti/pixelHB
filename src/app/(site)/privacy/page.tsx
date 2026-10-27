/**
 * Purpose:
 * Privacy route: what PixelHB stores and what it can access in Google Drive.
 */
import { privacyMetadata } from "@/content/metadata";
import { PrivacyScreen } from "@/features/site/components/PrivacyScreen";

export const metadata = privacyMetadata;

export default function PrivacyPage() {
  return <PrivacyScreen />;
}
