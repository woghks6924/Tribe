-- AlterTable
ALTER TABLE "SiteSettings"
  ADD COLUMN     "heroBadgeText" TEXT NOT NULL DEFAULT '#TRIBERUN',
  ADD COLUMN     "heroHeadline" TEXT NOT NULL DEFAULT E'One Tribe.\nEndless Tries.',
  ADD COLUMN     "heroSubtext" TEXT NOT NULL DEFAULT 'Runningwear for those who run the city at night. Tri.be — one tribe, built by runners who believe in the repeat, not the record.',
  ADD COLUMN     "storyLabel" TEXT NOT NULL DEFAULT 'FIG. 01 — Philosophy',
  ADD COLUMN     "storyHeadline" TEXT NOT NULL DEFAULT E'Not the perfect run.\nThe endless next one.',
  ADD COLUMN     "storyBody" TEXT NOT NULL DEFAULT 'Runners forged by repetition, not perfection, on the street. Tri.be was built for runners who believe in the repeat over the record — one tribe, running the same pace together.',
  ADD COLUMN     "crewLabel" TEXT NOT NULL DEFAULT 'FIG. 02 — Crew',
  ADD COLUMN     "crewHeadline" TEXT NOT NULL DEFAULT E'Run alone, it''s a jog.\nRun together, it''s a tribe.',
  ADD COLUMN     "crewBody" TEXT NOT NULL DEFAULT 'Every Tuesday night, the Tri.be run club crosses the city. Every pace is different — the finish line is always together.',
  ADD COLUMN     "crewCta" TEXT NOT NULL DEFAULT 'JOIN THE TRIBE',
  ADD COLUMN     "newsletterHeadline" TEXT NOT NULL DEFAULT 'Join the Tribe',
  ADD COLUMN     "newsletterBody" TEXT NOT NULL DEFAULT 'Every Tuesday, get run club news and new product previews first.';
