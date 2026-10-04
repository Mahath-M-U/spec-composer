import { applyDefaultBrandKit } from "./brand-kits";
import { formats } from "./formats";
import { generateMaterialColorKit, tone } from "./material-kits";
import { createElement } from "./registry";
import {
  CAFE_MORNING_MODEL,
  CAFE_MORNING_SCENE,
  COASTAL_WEEKEND_MODEL,
  COASTAL_WEEKEND_SCENE,
  EVERYDAY_SKINCARE_MODEL,
  EVERYDAY_SKINCARE_SCENE,
  MOVEMENT_CLUB_DETAIL,
  MOVEMENT_CLUB_DETAIL_SCENE,
  MOVEMENT_CLUB_MODEL,
  MOVEMENT_CLUB_SCENE,
  STREET_STYLE_MODEL,
  STREET_STYLE_SCENE,
} from "./template-scenes";
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  boldBlock,
  businessCard,
  collage,
  editorialSerif,
  FONT,
  megaType,
  modelFeedPost,
  newsprint,
  ornamentFrame,
  promoSplit,
  retroSticker,
  spotlight,
  verticalType,
  visual,
  voucher,
  type Palette,
  type SlotSpec,
} from "./template-layouts";
import {
  isTextKind,
  type ElementKind,
  type Format,
  type SpecDocument,
  type SpecElement,
} from "./types";

export const templateCategoryKeys = [
  "All",
  "Marketing",
  "Events",
  "Business",
  "Social",
  "Lifestyle",
  "Quotes",
  "Material 3",
] as const;

export type TemplateCategory = (typeof templateCategoryKeys)[number];

interface TemplateConfig {
  name: string;
  category: Exclude<TemplateCategory, "All">;
  colors: [string, string, string];
  /** Present for Material 3 templates: the seed color their tonal palette was generated from. */
  styleKitSeed?: string;
  /** Prompt Editor image style assigned to this starter template. */
  imageStyle?: string;
  layout: (c: Palette) => SlotSpec[];
}

/** Reduces a generated M3 tonal-palette kit to the [background, primary, accent] tuple templates use. */
function m3Colors(seedHex: string): [string, string, string] {
  const kit = generateMaterialColorKit(seedHex);
  return [tone(kit.neutral, 95), tone(kit.primary, 30), tone(kit.tertiary, 60)];
}

const configs: TemplateConfig[] = [
  {
    name: "Product Launch",
    imageStyle: "retro-vintage",
    category: "Marketing",
    colors: ["#0F0E13", "#F4F1EA", "#A78BFA"],
    layout: spotlight(
      {
        eyebrow: "New arrival",
        note: "Lumen · 12 March",
        title: "Glow, bottled.",
        sub: "Plant-powered hydration that lasts all day.",
        cta: "Shop the launch",
      },
      visual(
        "productImage",
        "product-bottle",
        "Frosted glass serum bottle with a dropper cap on a stone plinth, lit by a single soft spotlight",
      ),
    ),
  },
  {
    name: "Flash Sale",
    imageStyle: "flat-illustration",
    category: "Marketing",
    colors: ["#E11D2E", "#FFF4E6", "#FFD23F"],
    layout: boldBlock(
      {
        eyebrow: "Moda · Summer edit",
        note: "48 hours only",
        title: "FLASH SALE",
        offer: "50% OFF",
        sub: "Everything in the summer edit, from $29",
        body: "Ends Sunday midnight\nFree returns on every order",
        cta: "Shop the sale",
      },
      visual(
        "humanModelImage",
        "bust-curly",
        "Half-body portrait of a smiling model in a bright yellow top against a red backdrop",
      ),
    ),
  },
  {
    name: "Fashion Editorial",
    imageStyle: "watercolor",
    category: "Social",
    colors: ["#E9E4DC", "#141414", "#B4532A"],
    layout: megaType(
      {
        eyebrow: "Issue 07",
        note: "Autumn / Winter",
        title: "THE QUIET",
        sub: "SEASON",
        body: "Layered neutrals and soft tailoring\nfor the colder months",
        cta: "Read the issue",
      },
      visual(
        "humanModelImage",
        "bust-woman",
        "Editorial half-body portrait of a woman in a rust knit, soft studio light, neutral backdrop",
      ),
    ),
  },
  {
    name: "Event Announcement",
    imageStyle: "paper-cut",
    category: "Events",
    colors: ["#0E1220", "#F5F3EE", "#F5A524"],
    layout: megaType(
      {
        eyebrow: "Live · 14 Nov 2026",
        note: "San Francisco",
        title: "DESIGN SYSTEMS",
        sub: "SUMMIT 2026",
        body: "Pier 27 · 9 AM – 6 PM\n40 speakers, 12 workshops",
        cta: "Reserve a seat",
      },
      visual(
        "heroImage",
        "event-stage",
        "Audience facing a lit conference stage, warm amber spotlights, wide shot from the back of the room",
      ),
      { font: FONT.bebas, scene: true },
    ),
  },
  {
    name: "Minimal Quote",
    imageStyle: "claymorphism",
    category: "Quotes",
    colors: ["#F2EDE3", "#1A1A1A", "#B91C1C"],
    layout: newsprint(
      {
        eyebrow: "Vol. 18 · Studio Notes · Free",
        title: "The Daily Quote",
        sub: "“Make it simple, then make it matter.”",
        note: "Mara Ellison, designer and writer",
        body: "Good design is rarely loud. It removes what distracts, keeps what serves, and leaves room for the idea to breathe.\n\nThis week: five studios that treat restraint as a feature, and what their process teaches about clarity.",
        cta: "Read more",
        badge: "Every Friday",
      },
      visual(
        "supportingImage",
        "bust-woman-2",
        "Black-and-white portrait of a designer with glasses at her desk",
      ),
    ),
  },
  {
    name: "Business Card",
    imageStyle: "3d-render",
    category: "Business",
    colors: ["#0F172A", "#F8FAFC", "#38BDF8"],
    layout: businessCard,
  },
  {
    name: "Restaurant Menu",
    imageStyle: "photorealistic",
    category: "Business",
    colors: ["#1C1410", "#F6EBDD", "#E4A04B"],
    layout: promoSplit(
      {
        eyebrow: "Seasonal menu",
        title: "Olive & Ember",
        sub: "Wood-fired plates from the farms around us.",
        note: "Open daily · 12 – 10 PM · Book a table",
      },
      visual(
        "supportingImage",
        "food-bowl",
        "Overhead shot of a rustic ceramic bowl of roasted vegetables on dark linen",
      ),
      {
        items: [
          ["Charred leeks, whipped feta", "$14"],
          ["Wood-fired flatbread", "$16"],
          ["Slow-roasted lamb shoulder", "$32"],
          ["Burnt honey panna cotta", "$11"],
        ],
      },
    ),
  },
  {
    name: "Party Invitation",
    imageStyle: "isometric",
    category: "Events",
    colors: ["#FF5FA2", "#2B0A3D", "#FFE14D"],
    layout: retroSticker(
      {
        eyebrow: "You're invited",
        note: "18 · 10 · 2026",
        title: "MAYA TURNS 30!",
        badge: "RSVP by 10 Oct",
        body: "Saturday, 8 PM\nThe Loft, 214 Grand Street",
        cta: "I'll be there",
      },
      visual(
        "heroImage",
        "balloons",
        "Cluster of glossy balloons and confetti on a hot-pink backdrop",
      ),
    ),
  },
  {
    name: "Job Opening",
    imageStyle: "vector",
    category: "Business",
    colors: ["#0F3D2E", "#F1F5EE", "#7EE081"],
    layout: collage(
      {
        badge: "We're hiring",
        title: "SENIOR FRONTEND ENGINEER",
        sub: "Remote · Full-time · $150k – $180k",
        body: "Build the tools designers use every day.",
        cta: "Apply now",
      },
      [
        visual(
          "humanModelImage",
          "bust-woman-2",
          "Engineer with glasses smiling at her desk, natural office light",
        ),
        visual(
          "supportingImage",
          "laptop-screen",
          "Laptop showing a code editor and a video call",
          { fit: "contain" },
        ),
        visual(
          "humanModelImage",
          "bust-man",
          "Bearded team lead in a blazer, relaxed office portrait",
        ),
      ],
    ),
  },
  {
    name: "Webinar Promo",
    imageStyle: "hand-drawn",
    category: "Marketing",
    colors: ["#F1F0FA", "#1E1B4B", "#5B5BD6"],
    layout: editorialSerif(
      {
        eyebrow: "Free live webinar",
        note: "Thu 6 Nov · 11 AM PT",
        title: "Scaling Design Systems",
        sub: "tokens, governance and adoption",
        body: "A practical 60-minute session\nwith live Q&A.",
        cta: "Save my seat",
      },
      visual(
        "supportingImage",
        "laptop-screen",
        "Laptop showing a video call with two speakers and presentation slides",
        { fit: "contain" },
      ),
    ),
  },
  {
    name: "Real Estate Listing",
    imageStyle: "cyberpunk-neon",
    category: "Business",
    colors: ["#F5F2EC", "#1C1917", "#B8860B"],
    layout: promoSplit(
      {
        eyebrow: "Just listed · Oakridge",
        title: "Modern family home",
        sub: "4 bed · 3 bath · 2,450 sq ft\nOpen house Sunday, 1 – 4 PM",
        price: "$865,000",
        body: "• South-facing garden\n• Chef's kitchen\n• Two-car garage",
        cta: "Book a viewing",
        note: "oakridgehomes.co",
      },
      visual(
        "heroImage",
        "house",
        "Modern two-storey family home with a gabled roof and front garden at golden hour",
      ),
    ),
  },
  {
    name: "Fitness Class",
    imageStyle: "anime",
    category: "Lifestyle",
    colors: ["#0C0A09", "#FAFAF9", "#FF6A13"],
    layout: verticalType(
      {
        eyebrow: "Mondays · 7 AM",
        title: "POWER HOUR",
        sub: "45 minutes. Full body. All levels welcome.",
        cta: "Book a spot",
        note: "Studio 4 · Eastside",
      },
      visual(
        "humanModelImage",
        "person-active-man",
        "Athlete mid-jump with arms raised in orange activewear, dark studio, dramatic rim light",
      ),
    ),
  },
  {
    name: "Podcast Episode",
    imageStyle: "cinematic",
    category: "Social",
    colors: ["#1E1B4B", "#EDE9FE", "#C084FC"],
    layout: editorialSerif(
      {
        eyebrow: "Episode 42",
        note: "Out now",
        title: "Building in Public",
        sub: "with guest Dana Ortiz",
        body: "Why sharing early beats\nlaunching loud.",
        cta: "Listen now",
      },
      visual(
        "heroImage",
        "microphone",
        "Studio podcast microphone with purple backlight and soft haze",
        { fit: "contain" },
      ),
    ),
  },
  {
    name: "Coming Soon",
    imageStyle: "neumorphism",
    category: "Marketing",
    colors: ["#05060A", "#F1F5F9", "#38BDF8"],
    layout: spotlight(
      {
        eyebrow: "Something new",
        note: "01 · 12 · 2026",
        title: "Coming Soon",
        sub: "Join the waitlist for early access.",
        cta: "Join the waitlist",
      },
      null,
      { font: FONT.italiana },
    ),
  },
  {
    name: "Customer Testimonial",
    imageStyle: "glassmorphism",
    category: "Marketing",
    colors: ["#FFF4E8", "#3B1D0E", "#F97316"],
    layout: collage(
      {
        badge: "Customer story",
        title: "“HALF THE TIME, TWICE THE CRAFT.”",
        sub: "Jordan Lee, Head of Design at Brightline",
        body: "How Brightline shipped its redesign in six weeks.",
        cta: "Read the story",
      },
      [
        visual(
          "supportingImage",
          "bust-man",
          "Warm portrait of a bearded design lead in a bright office",
        ),
        visual(
          "supportingImage",
          "bust-curly",
          "Designer with curly hair reviewing work on a wall",
        ),
        visual(
          "supportingImage",
          "bust-woman",
          "Product manager smiling during a team review",
        ),
      ],
    ),
  },
  {
    name: "Seasonal Sale",
    imageStyle: "pixel-art",
    category: "Marketing",
    colors: ["#0F5132", "#FFF8E7", "#E63946"],
    layout: boldBlock(
      {
        eyebrow: "Winter sale",
        note: "Ends 24 Dec",
        title: "GIFT SEASON",
        offer: "UP TO 40%",
        sub: "Gifts for everyone on your list, from $19",
        body: "Free gift wrapping\nin store and online",
        cta: "Shop gifts",
      },
      visual(
        "productImage",
        "gift",
        "Wrapped gift box with a red ribbon bow on a deep green backdrop",
      ),
    ),
  },
  {
    name: "Wedding Invitation",
    imageStyle: "low-poly",
    category: "Events",
    colors: ["#FBF7F0", "#3F3527", "#B8912F"],
    layout: ornamentFrame(
      {
        eyebrow: "Together with their families",
        title: "Amara & Theo",
        sub: "request the pleasure of your company",
        body: "Saturday, 12 June 2027 · 4 PM\nHollow Oak Estate, Napa Valley",
        cta: "Kindly RSVP",
      },
      null,
      { ornament: "floral-frame" },
    ),
  },
  {
    name: "Baby Shower Invite",
    imageStyle: "line-art",
    category: "Events",
    colors: ["#BDE0FE", "#0B3C5D", "#FFFFFF"],
    layout: retroSticker(
      {
        eyebrow: "Baby shower",
        note: "09 · 11",
        title: "OH BABY, IT'S LEO!",
        badge: "Sunday 2 PM",
        body: "Hosted by Grace\n18 Willow Lane",
        cta: "RSVP to Grace",
      },
      visual(
        "heroImage",
        "moon-cloud",
        "Soft nursery scene of a smiling moon, clouds, and stars in pastel blue",
      ),
    ),
  },
  {
    name: "Graduation Announcement",
    imageStyle: "photorealistic",
    category: "Events",
    colors: ["#14213D", "#F8F4E3", "#E9C46A"],
    layout: ornamentFrame(
      {
        eyebrow: "Class of 2026",
        title: "Congratulations, Sofia",
        sub: "Bachelor of Science in Architecture",
        body: "Ceremony · 30 May · 10 AM\nMain Quad, Westbrook University",
      },
      visual(
        "heroImage",
        "graduation-cap",
        "Graduation cap with a gold tassel and a rolled diploma on navy",
      ),
      { ornament: "gold-frame", titleColor: "accent" },
    ),
  },
  {
    name: "Holiday Greeting Card",
    imageStyle: "low-poly",
    category: "Social",
    colors: ["#7F1D1D", "#FDF6E3", "#E9C46A"],
    layout: ornamentFrame(
      {
        eyebrow: "Season's greetings",
        title: "Warm Wishes",
        sub: "for the holidays and the year ahead",
        body: "With love from the Carter family",
      },
      visual(
        "heroImage",
        "family",
        "Family of three in cosy knitwear beside a decorated evergreen tree",
      ),
      { ornament: "gold-frame", titleColor: "accent" },
    ),
  },
  {
    name: "New Year Countdown",
    imageStyle: "anime",
    category: "Social",
    colors: ["#07070B", "#FAFAFA", "#F2C94C"],
    layout: megaType(
      {
        eyebrow: "31 December",
        note: "Rooftop · 11 PM",
        title: "COUNTDOWN",
        sub: "TO 2027",
        body: "Live DJ, skyline views\nand a midnight toast",
        cta: "Get tickets",
      },
      visual(
        "heroImage",
        "fireworks",
        "Gold fireworks bursting over a night city skyline",
      ),
      { font: FONT.bebas, scene: true },
    ),
  },
  {
    name: "Recipe Card",
    imageStyle: "vector",
    category: "Lifestyle",
    colors: ["#FFF7E6", "#4A2511", "#E4572E"],
    layout: promoSplit(
      {
        eyebrow: "Weeknight dinner · 25 min",
        title: "Roasted squash grain bowl",
        sub: "Farro, crispy chickpeas, tahini and a squeeze of lemon.",
        body: "• 1 cup farro\n• 1 small squash\n• 1 can chickpeas\n• 3 tbsp tahini",
        note: "Serves 4 · Vegetarian",
      },
      visual(
        "productImage",
        "food-bowl",
        "Overhead shot of a grain bowl with roasted squash, chickpeas, and a tahini drizzle",
      ),
    ),
  },
  {
    name: "Travel Promo",
    imageStyle: "glassmorphism",
    category: "Marketing",
    colors: ["#E8F6F8", "#0B3B4A", "#0FA3B1"],
    layout: promoSplit(
      {
        eyebrow: "Island escape",
        title: "Santorini in seven nights",
        sub: "Flights, a boutique hotel and a sunset sail included.",
        price: "From $1,290",
        body: "• Direct flights\n• Sea-view suite\n• Breakfast daily",
        cta: "Plan my trip",
        note: "Departures May – Oct",
      },
      visual(
        "heroImage",
        "landscape",
        "Whitewashed village above a turquoise sea at sunset",
      ),
    ),
  },
  {
    name: "Music Concert Poster",
    imageStyle: "cyberpunk-neon",
    category: "Events",
    colors: ["#1A0B2E", "#F8F0FF", "#FF3CAC"],
    layout: boldBlock(
      {
        eyebrow: "World tour 2026",
        note: "Fox Theatre",
        title: "THE NIGHT OWLS",
        offer: "ONE NIGHT ONLY",
        sub: "with special guest Luma",
        body: "Saturday 22 November\nDoors 7 PM",
        cta: "Get tickets",
      },
      visual(
        "heroImage",
        "profile",
        "Dramatic side-profile silhouette of a singer under magenta stage light",
      ),
      { font: FONT.anton },
    ),
  },
  {
    name: "Yoga Retreat",
    imageStyle: "pixel-art",
    category: "Lifestyle",
    colors: ["#EEF0E5", "#2F3A25", "#B9C49A"],
    layout: verticalType(
      {
        eyebrow: "Weekend retreat",
        title: "Slow down",
        sub: "Three days of yoga, breathwork and forest walks.",
        cta: "Reserve your mat",
        note: "14 – 16 Nov · Sonoma",
      },
      visual(
        "humanModelImage",
        "person-meditate",
        "Person meditating cross-legged on a mat in soft morning light among trees",
      ),
      { font: FONT.serif },
    ),
  },
  {
    name: "Book Launch",
    imageStyle: "cinematic",
    category: "Marketing",
    colors: ["#F7EFE9", "#3B0918", "#9F1239"],
    layout: editorialSerif(
      {
        eyebrow: "New release",
        note: "In stores 3 March",
        title: "The Weight of Small Things",
        sub: "a novel by Elena Marsh",
        body: "“Quietly devastating.”\nThe Literary Review",
        cta: "Pre-order now",
      },
      visual(
        "productImage",
        "book-stack",
        "Hardcover novel with a deep red jacket standing on a stack of books",
        { fit: "contain" },
      ),
    ),
  },
  {
    name: "Startup Pitch Cover",
    imageStyle: "line-art",
    category: "Business",
    colors: ["#0B1220", "#E2E8F0", "#22D3EE"],
    layout: editorialSerif(
      {
        eyebrow: "Seed round · 2026",
        note: "Confidential",
        title: "Relay",
        sub: "payments for creators",
        body: "Investor presentation\nQ4 2026",
      },
      visual(
        "supportingImage",
        "chart-growth",
        "Clean upward growth chart on a dark dashboard",
        { fit: "contain" },
      ),
    ),
  },
  {
    name: "Newsletter Header",
    imageStyle: "hand-drawn",
    category: "Business",
    colors: ["#F6F3EC", "#111827", "#2563EB"],
    layout: newsprint(
      {
        eyebrow: "Issue 18 · September 2026",
        title: "The Weekly Grid",
        sub: "Design notes, tools, and one good idea every Friday.",
        note: "The city at dawn, from our studio roof",
        body: "This week: why the best dashboards start on paper, a font pairing that never fails, and the tiny habit that keeps our backlog honest.\n\nPlus five links worth your coffee break.",
        cta: "Subscribe free",
        badge: "Free · Every Friday",
      },
      visual(
        "supportingImage",
        "city-skyline",
        "City skyline at dawn with lit windows",
      ),
    ),
  },
  {
    name: "Coupon Voucher",
    imageStyle: "isometric",
    category: "Marketing",
    colors: ["#FFE8A3", "#3D2A00", "#E85D04"],
    layout: voucher({
      eyebrow: "Thank-you gift",
      offer: "$20 OFF",
      title: "Your next order over $80",
      body: "THANKS20",
      cta: "Redeem online",
      note: "Valid until 31 December 2026",
    }),
  },
  {
    name: "Product Catalog Cover",
    imageStyle: "retro-vintage",
    category: "Business",
    colors: ["#F3F1EC", "#1C1B19", "#B5651D"],
    layout: collage(
      {
        badge: "AW 2026",
        title: "HOME GOODS CATALOG",
        sub: "120 pieces for slower living",
        body: "Ceramics, linen and light for every room.",
        cta: "Browse the collection",
      },
      [
        visual(
          "productImage",
          "vase-set",
          "Ceramic vases in earthy glazes on a linen-covered plinth",
          { fit: "contain", focal: [0.5, 1] },
        ),
        visual(
          "productImage",
          "perfume",
          "Amber glass diffuser bottle on a stone tray",
          { fit: "contain", focal: [0.5, 1] },
        ),
        visual(
          "productImage",
          "headphones",
          "Oat-colored wireless headphones on a wooden shelf",
          { fit: "contain", focal: [0.5, 1] },
        ),
      ],
    ),
  },
  {
    name: "Charity Fundraiser",
    imageStyle: "watercolor",
    category: "Events",
    colors: ["#0F766E", "#F0FDFA", "#FDE68A"],
    layout: boldBlock(
      {
        eyebrow: "Charity gala",
        note: "Riverside Hall · 6 Dec",
        title: "EVERY MEAL MATTERS",
        offer: "$50 FEEDS A FAMILY",
        sub: "Help us serve 10,000 meals this winter.",
        body: "Dinner, music and an auction\nfor the Riverside Food Bank",
        cta: "Donate today",
      },
      visual(
        "heroImage",
        "heart-hands",
        "Hands gently holding a heart, warm community volunteering scene",
      ),
      { font: FONT.anton },
    ),
  },
  {
    name: "Online Course Promo",
    imageStyle: "paper-cut",
    category: "Marketing",
    colors: ["#F5F3FF", "#2E1065", "#7C3AED"],
    layout: editorialSerif(
      {
        eyebrow: "Self-paced course",
        note: "Start anytime",
        title: "Design Thinking Fundamentals",
        sub: "12 lessons, real projects, one certificate",
        price: "$99",
        body: "Learn to frame problems\nand test ideas fast.",
        cta: "Enroll now",
      },
      visual(
        "supportingImage",
        "lightbulb",
        "Glowing lightbulb with a violet filament on a soft lavender backdrop",
        { fit: "contain" },
      ),
    ),
  },
  {
    name: "App Launch",
    imageStyle: "neumorphism",
    category: "Marketing",
    colors: ["#0A1A3F", "#EAF2FF", "#3B82F6"],
    layout: spotlight(
      {
        eyebrow: "Now on iOS & Android",
        note: "4.8 ★ · 12k reviews",
        title: "Plan less, live more",
        sub: "Tempo turns your to-dos into a calm daily rhythm.",
        cta: "Download free",
      },
      visual(
        "productImage",
        "phone-app",
        "Smartphone showing a clean planner app with a notification, glowing blue light",
      ),
      { font: FONT.bebas },
    ),
  },
  {
    name: "Anniversary Card",
    imageStyle: "flat-illustration",
    category: "Social",
    colors: ["#FFF1F2", "#881337", "#E11D48"],
    layout: ornamentFrame(
      {
        eyebrow: "Happy anniversary",
        title: "Ten Years of Us",
        sub: "here's to every adventure still ahead",
        body: "With all my love,\nSam",
      },
      visual(
        "heroImage",
        "champagne",
        "Two champagne flutes clinking with sparkles on a blush backdrop",
      ),
      { ornament: "floral-frame", titleColor: "accent" },
    ),
  },
  {
    name: "Motivational Poster",
    imageStyle: "claymorphism",
    category: "Quotes",
    colors: ["#FFD23F", "#111111", "#EE4266"],
    layout: retroSticker(
      {
        eyebrow: "Monday reminder",
        note: "No. 12",
        title: "SMALL STEPS STILL MOVE YOU FORWARD.",
        badge: "Keep going",
        body: "Pin it. Share it.\nDo the next small thing.",
      },
      null,
    ),
  },
  {
    name: "Team Hiring Banner",
    imageStyle: "3d-render",
    category: "Business",
    colors: ["#EEF2FF", "#1E1B4B", "#4F46E5"],
    layout: collage(
      {
        badge: "Join our team",
        title: "WE'RE HIRING",
        sub: "across design and engineering",
        body: "8 open roles · Remote-friendly\nGreat benefits",
        cta: "See open roles",
      },
      [
        visual(
          "humanModelImage",
          "bust-curly",
          "Designer with curly hair smiling in a bright studio",
        ),
        visual(
          "humanModelImage",
          "bust-man",
          "Engineer with a beard in a relaxed office portrait",
        ),
        visual(
          "humanModelImage",
          "bust-woman",
          "Product manager with long hair laughing with colleagues",
        ),
      ],
    ),
  },
  {
    name: "M3 Product Spotlight",
    imageStyle: "cinematic",
    category: "Material 3",
    colors: m3Colors("#6750A4"),
    styleKitSeed: "#6750A4",
    layout: spotlight(
      {
        eyebrow: "Product spotlight",
        note: "$28",
        title: "Aura hydrating mist",
        sub: "A fine daily mist with hyaluronic acid and rosewater.",
        cta: "Buy now",
      },
      visual(
        "productImage",
        "perfume",
        "Frosted spray bottle on a soft lilac pedestal, studio light",
      ),
    ),
  },
  {
    name: "M3 Event Poster",
    imageStyle: "3d-render",
    category: "Material 3",
    colors: m3Colors("#006A6A"),
    styleKitSeed: "#006A6A",
    layout: editorialSerif(
      {
        eyebrow: "Community meetup",
        note: "20 Nov · 6 PM",
        title: "Material Design Night",
        sub: "talks, demos and pizza",
        body: "Makers' Hall, Austin\nFree entry, limited seats",
        cta: "Register free",
      },
      visual(
        "heroImage",
        "event-stage",
        "Small meetup audience facing a speaker and slides, teal lighting",
      ),
      { radius: 48 },
    ),
  },
  {
    name: "M3 Seasonal Offer",
    imageStyle: "glassmorphism",
    category: "Material 3",
    colors: m3Colors("#8B5000"),
    styleKitSeed: "#8B5000",
    layout: boldBlock(
      {
        eyebrow: "Members",
        note: "Through 30 April",
        title: "SPRING OFFER",
        offer: "25% OFF",
        sub: "Fresh picks for a new season",
        body: "Members save more\non every order",
        cta: "Shop the offer",
      },
      visual(
        "productImage",
        "gift",
        "Gift box with a warm amber ribbon, soft studio light",
      ),
    ),
  },
  {
    name: "M3 Editorial Cover",
    imageStyle: "neumorphism",
    category: "Material 3",
    colors: m3Colors("#984061"),
    styleKitSeed: "#984061",
    layout: megaType(
      {
        eyebrow: "Issue 12",
        note: "The color issue",
        title: "TONAL",
        sub: "LIVING",
        body: "How one seed color\nshapes a whole home",
        cta: "Read the issue",
      },
      visual(
        "humanModelImage",
        "bust-man",
        "Editorial half-body portrait of a male model in a rose-toned blazer against a tonal backdrop",
      ),
    ),
  },
  {
    name: "M3 App Announcement",
    imageStyle: "flat-illustration",
    category: "Material 3",
    colors: m3Colors("#375CA9"),
    styleKitSeed: "#375CA9",
    layout: spotlight(
      {
        eyebrow: "What's new",
        note: "Version 5.0",
        title: "Dynamic color is here",
        sub: "Your app now adapts to your wallpaper and style.",
        cta: "Update now",
      },
      visual(
        "productImage",
        "phone-app",
        "Smartphone showing an app themed from the wallpaper's colors",
      ),
    ),
  },
  {
    name: "M3 Quote Card",
    imageStyle: "anime",
    category: "Material 3",
    colors: m3Colors("#4F6353"),
    styleKitSeed: "#4F6353",
    layout: retroSticker(
      {
        eyebrow: "Daily note",
        note: "Kandinsky",
        title: "“Color is a power which directly influences the soul.”",
        badge: "Save this",
        body: "Wassily Kandinsky,\nConcerning the Spiritual in Art",
      },
      null,
      { font: FONT.serif },
    ),
  },
  {
    name: "Street Style Fit Check",
    imageStyle: "photorealistic",
    category: "Social",
    colors: ["#18201E", "#F8F6F0", "#D6B79B"],
    layout: modelFeedPost(
      {
        eyebrow: "@mira.style",
        title: "today's fit",
        body: "One blazer, all day.",
      },
      STREET_STYLE_MODEL,
      { variant: "immersive", scene: STREET_STYLE_SCENE },
    ),
  },
  {
    name: "Everyday Skincare",
    imageStyle: "photorealistic",
    category: "Lifestyle",
    colors: ["#F7F2EC", "#302A27", "#B77D68"],
    layout: modelFeedPost(
      {
        eyebrow: "@sana.skin",
        title: "a softer morning",
        body: "Cleanse · hydrate · go",
        note: "A LITTLE ROUTINE",
      },
      EVERYDAY_SKINCARE_MODEL,
      { variant: "caption", scene: EVERYDAY_SKINCARE_SCENE },
    ),
  },
  {
    name: "Cafe Morning",
    imageStyle: "cinematic",
    category: "Social",
    colors: ["#F2ECE3", "#2D261F", "#A46A49"],
    layout: modelFeedPost(
      {
        eyebrow: "@eli.days",
        note: "SUNDAY",
        title: "coffee, then everything",
        body: "A little pause between plans.",
      },
      CAFE_MORNING_MODEL,
      { variant: "framed", scene: CAFE_MORNING_SCENE },
    ),
  },
  {
    name: "Movement Club",
    imageStyle: "photorealistic",
    category: "Lifestyle",
    colors: ["#E8EEE9", "#1F3D36", "#789B7E"],
    layout: modelFeedPost(
      {
        eyebrow: "@move.with.ana",
        title: "move at your pace",
        body: "Fresh air. No finish line.",
      },
      MOVEMENT_CLUB_MODEL,
      {
        variant: "split",
        detail: MOVEMENT_CLUB_DETAIL,
        scene: MOVEMENT_CLUB_SCENE,
        detailScene: MOVEMENT_CLUB_DETAIL_SCENE,
      },
    ),
  },
  {
    name: "Coastal Weekend",
    imageStyle: "cinematic",
    category: "Social",
    colors: ["#F6F2EA", "#233B49", "#B98269"],
    layout: modelFeedPost(
      {
        eyebrow: "@noa.travels",
        title: "weekend notes",
        body: "The coast, slowly.",
      },
      COASTAL_WEEKEND_MODEL,
      { variant: "diary", scene: COASTAL_WEEKEND_SCENE },
    ),
  },
  {
    name: "After Dark Sessions",
    imageStyle: "cinematic",
    category: "Events",
    colors: ["#101019", "#F8F1E8", "#D97745"],
    layout: spotlight(
      {
        eyebrow: "Live music",
        note: "Friday · 8 PM",
        title: "AFTER DARK",
        sub: "An intimate night of live sound.",
        cta: "Book a seat",
      },
      visual(
        "heroImage",
        "guitar",
        "Single electric guitar on a small dark stage in a warm amber spotlight, with a faint haze and no performer",
      ),
      { font: FONT.bebas },
    ),
  },
  {
    name: "Studio Workshop",
    imageStyle: "vector",
    category: "Business",
    colors: ["#F0EFE8", "#20372E", "#C06A4D"],
    layout: editorialSerif(
      {
        eyebrow: "North Studio",
        note: "Creative practice",
        title: "Make better things",
        sub: "A hands-on design workshop",
        body: "Ideas, sketches, and practical tools.\nSaturday · 10 AM",
        cta: "Save a place",
      },
      visual(
        "supportingImage",
        "laptop-screen",
        "Minimal laptop showing a simple design canvas with geometric blocks, alongside a pencil and paper on a warm studio desk",
      ),
    ),
  },
  {
    name: "Sunday Market",
    imageStyle: "flat-illustration",
    category: "Lifestyle",
    colors: ["#FFF2D9", "#254B3C", "#E3794F"],
    layout: promoSplit(
      {
        eyebrow: "Fresh this week",
        title: "Sunday Market",
        sub: "Good food from local makers.",
        body: "Seasonal produce\nSmall-batch treats",
        cta: "Come by",
        note: "Sundays · 9 AM – 2 PM",
      },
      visual(
        "supportingImage",
        "food-bowl",
        "Bright overhead flat illustration of a ceramic bowl filled with leafy greens, tomatoes and citrus on a warm tabletop",
      ),
    ),
  },
];

const DEFAULT_FORMAT: Format = formats[0] ?? {
  id: "instagram-post",
  label: "Instagram Post",
  subtitle: "4:5",
  width: 1080,
  height: 1350,
  category: "Instagram",
};

function resolveFormat(formatOrId?: string | Format): Format {
  if (typeof formatOrId === "object") return formatOrId;
  return formats.find((f) => f.id === formatOrId) ?? DEFAULT_FORMAT;
}

/** Builds an authored layout at the target format's size. */
function buildSlots(cfg: TemplateConfig, format: Format): SpecElement[] {
  const { width: w, height: h } = format;
  const typeScale = Math.min(w / BASE_WIDTH, h / BASE_HEIGHT);
  const [bg, ink, accent] = cfg.colors;
  const counts: Partial<Record<ElementKind, number>> = {};
  return cfg
    .layout({ bg, ink, accent })
    .filter((slot) => !(isTextKind(slot.kind) && !slot.content))
    .map((slot, i) => {
      const n = counts[slot.kind] ?? 0;
      counts[slot.kind] = n + 1;
      const el = createElement(slot.kind, format, n);
      const [x, y, bw, bh] = slot.box;
      const rotation = slot.rotation ?? 0;
      if (Math.abs(rotation) === 90) {
        // The box is the rotated extent; the element's own box runs along it.
        const cx = w * (x + bw / 2);
        const cy = h * (y + bh / 2);
        el.width = Math.max(1, Math.round(h * bh));
        el.height = Math.max(1, Math.round(w * bw));
        el.x = Math.round(cx - el.width / 2);
        el.y = Math.round(cy - el.height / 2);
      } else {
        el.x = Math.round(w * x);
        el.y = Math.round(h * y);
        el.width = Math.max(1, Math.round(w * bw));
        el.height = Math.max(1, Math.round(h * bh));
      }
      if (slot.style?.shapeType === "circle" && el.width !== el.height) {
        // Circles stay round in other aspect ratios, centered in their box.
        const d = Math.min(el.width, el.height);
        el.x += Math.round((el.width - d) / 2);
        el.y += Math.round((el.height - d) / 2);
        el.width = d;
        el.height = d;
      }
      el.rotation = rotation;
      el.zIndex = i + 1;
      if (slot.name) el.name = slot.name;
      if (slot.content !== undefined) el.content = slot.content;
      if (slot.aiDescription) el.aiDescription = slot.aiDescription;
      if (slot.placeholderArt) el.placeholderArt = slot.placeholderArt;
      if (slot.group) el.groupId = `group_${slot.group}`;
      el.style = { ...el.style, ...slot.style };
      if (el.style.fontSize)
        el.style.fontSize = Math.round(el.style.fontSize * typeScale);
      if (el.style.letterSpacing)
        el.style.letterSpacing =
          Math.round(el.style.letterSpacing * typeScale * 10) / 10;
      return el;
    });
}

export function createDocument(
  formatOrId: string | Format = "instagram-post",
  templateName?: string,
  { brandKit = true }: { brandKit?: boolean } = {},
): SpecDocument {
  const format = resolveFormat(formatOrId);
  const cfg = configs.find((c) => c.name === templateName);
  const now = new Date().toISOString();
  const doc: SpecDocument = {
    id: `project_${crypto.randomUUID()}`,
    version: "1.0",
    name: cfg?.name ?? `Untitled ${format.label}`,
    createdAt: now,
    updatedAt: now,
    format: { ...format },
    creativeDirection: {
      style: cfg ? "Editorial" : "Minimal",
      mood: ["clean", "confident"],
      primaryColor: cfg?.colors[1] ?? "#18181B",
      secondaryColor: cfg?.colors[2] ?? "#A78BFA",
      notes: "",
      typography: "Modern sans",
      styleKitId: cfg?.styleKitSeed
        ? `m3-template-${cfg.name.toLowerCase().replace(/\s+/g, "-")}`
        : undefined,
    },
    background: { type: "solid", value: cfg?.colors[0] ?? "#F5F1EA" },
    elements: cfg ? buildSlots(cfg, format) : [],
    imageBrief: "",
    promptMode: "design_skill",
    promptOptions: {
      exactText: true,
      relativePositioning: true,
      dimensions: true,
      colors: true,
      typography: true,
      negativeConstraints: true,
      elementConstraints: true,
      brandDirectives: true,
      mood: false,
      scene: false,
      lighting: false,
    },
    revision: 0,
  };
  if (cfg?.imageStyle) doc.imageStyle = cfg.imageStyle;
  if (brandKit) applyDefaultBrandKit(doc);
  return doc;
}

export const starterTemplates = configs.map((c) => ({
  name: c.name,
  category: c.category,
  // Starters stay brand-neutral; the default kit applies when one is opened.
  document: createDocument("instagram-post", c.name, { brandKit: false }),
}));

export function matchesTemplateQuery(
  name: string,
  category: string,
  query: string,
) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  const haystack = `${name} ${category}`.toLowerCase();
  return trimmed.split(/\s+/).every((term) => haystack.includes(term));
}

export function cloneTemplate(
  name: string,
  formatOrId: string | Format,
): SpecDocument {
  const doc = createDocument(formatOrId, name);
  doc.id = `project_${crypto.randomUUID()}`;
  doc.createdAt = new Date().toISOString();
  doc.updatedAt = doc.createdAt;
  return doc;
}
