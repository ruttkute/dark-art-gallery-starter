// data/artworks.js — single source of truth for all artwork data
// Both gallery.html and artwork-detail.html load this file via <script src="data/artworks.js">
// Using window.ARTWORKS (not ES module export) so it works without a build step or CORS server.

window.ARTWORKS = [
  {
    slug: 'work-title-one',
    title: 'WORK TITLE ONE',
    medium: 'Oil on linen, original',
    year: '2024',
    size: '21 × 30 cm',
    price: 650,
    description: 'Replace this with your painting\'s description. Write in present tense, as if the painting is a living thing. Describe what it holds, not what it depicts. This text appears on the detail page.',
    note: null,                   // optional short note shown under price
    images: [
      'images/work-title-one-1.jpg',   // main image
      'images/work-title-one-2.jpg',   // additional (shown in PhotoSwipe gallery)
    ],
    available: true,              // set to false to hide from gallery entirely
    type: 'original',
    tags: ['dark', 'figurative'],
  },
  {
    slug: 'work-title-two',
    title: 'WORK TITLE TWO',
    medium: 'Oil on canvas, original',
    year: '2024',
    size: '30 × 40 cm',
    price: 780,
    description: 'Each painting is a unique original. No prints. No editions.',
    note: null,
    images: [
      'images/work-title-two-1.jpg',
    ],
    available: true,
    type: 'original',
    tags: ['atmospheric'],
  },
  {
    slug: 'work-title-three',
    title: 'WORK TITLE THREE',
    medium: 'Oil on paper, original',
    year: '2023',
    size: '14 × 18 cm',
    price: 240,
    description: 'Small, intimate, permanent.',
    note: null,
    images: [
      'images/work-title-three-1.jpg',
    ],
    available: true,
    type: 'original',
    tags: ['small-format'],
  },
];
