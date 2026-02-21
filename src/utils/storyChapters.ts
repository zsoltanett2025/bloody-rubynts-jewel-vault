const BASE = import.meta.env.BASE_URL;

export type StoryChapter = {
  id: number;
  title: string;
  text: string;
  leftIcon: string;
  rightIcon: string;
};

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 1,
    title: "I. Fejezet — A Törött Rubin",
    text:
      "A Bloody Rubynts nem csupán egy érme. Egy ősi rubinkristály darabjai, melyek egykor megvédték a világot a sötétségtől. A mag széttört… és a darabok szétszóródtak.",
    leftIcon: `${BASE}assets/ui/knight_left.png`,
    rightIcon: `${BASE}assets/ui/knight_right.png`,
  },
  {
    id: 2,
    title: "II. Fejezet — Az Erdők Súgja",
    text:
      "Az első nyomok az erdő mélyéről érkeznek. Fák között rejtőző jelek, eltemetett emlékek… mintha valaki figyelne.",
    leftIcon: `${BASE}assets/ui/knight_left.png`,
    rightIcon: `${BASE}assets/ui/knight_right.png`,
  },
  {
    id: 3,
    title: "III. Fejezet — A Temető Árnyai",
    text:
      "A kövek alatt nem csak csontok nyugszanak. A rubin egy darabja pulzál, és a sötétség visszhangzik a sírok közt.",
    leftIcon: `${BASE}assets/ui/knight_left.png`,
    rightIcon: `${BASE}assets/ui/knight_right.png`,
  },
  {
    id: 4,
    title: "IV. Fejezet — A Kastély Mélye",
    text:
      "A kastély falai emlékeznek. A darabok közelebb kerülnek egymáshoz… de a káosz is. Egy rossz döntés felébresztheti.",
    leftIcon: `${BASE}assets/ui/knight_left.png`,
    rightIcon: `${BASE}assets/ui/knight_right.png`,
  },
  {
    id: 5,
    title: "V. Fejezet — A Mag Újjászületése",
    text:
      "Ha elég darab összeáll, a rubin magja újra formát ölt. A kérdés már csak az: egyensúly… vagy káosz?",
    leftIcon: `${BASE}assets/ui/knight_left.png`,
    rightIcon: `${BASE}assets/ui/knight_right.png`,
  },
];

// level -> chapter index (10 pályánként vált)
export function getChapterForLevel(level: number) {
  const idx = Math.floor((Math.max(1, level) - 1) / 10);
  return STORY_CHAPTERS[Math.min(idx, STORY_CHAPTERS.length - 1)];
}

