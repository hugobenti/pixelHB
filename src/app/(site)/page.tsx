/**
 * Purpose:
 * Home route: what PixelHB is, and the way into the gallery, plus the site's structured data.
 */
import { homeMetadata, homeStructuredData } from "@/content/metadata";
import { HomeScreen } from "@/features/site/components/HomeScreen";

export const metadata = homeMetadata;

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: homeStructuredData }} />
      <HomeScreen />
    </>
  );
}
