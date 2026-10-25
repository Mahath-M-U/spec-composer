import { templateAssetPatch, libraryVisual } from "./template-assets";
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
  layoutForFormat,
  fitTemplateText,
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
  formatId: string;
  layoutFamily: string;
  imageBrief: string;
  category: Exclude<TemplateCategory, "All">;
  colors: [string, string, string];
  /** Present for Material 3 templates: the seed color their tonal palette was generated from. */
  styleKitSeed?: string;
  /** Prompt Editor image style assigned to this starter template. */
  imageStyle: string;
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
    formatId: "instagram-post",
    imageBrief:
      "Premium skincare launch with frosted glass, a softly lit plum pedestal, and restrained oversized serif type.",
    imageStyle: "photorealistic",
    category: "Marketing",
    colors: ["#181126", "#FAF4E9", "#CDA9E8"],
    layoutFamily: "spotlight",
    layout: spotlight(
      {
        eyebrow: "New arrival",
        note: "Lumen · 12 March",
        title: "Glow, bottled.",
        sub: "Plant-powered hydration that lasts all day.",
        cta: "Shop the launch",
      },
      libraryVisual(
        "fashion-product-bottle",
        "Frosted glass serum bottle with a dropper cap on a stone plinth, lit by a single soft spotlight",
      ),
    ),
  },
  {
    name: "Flash Sale",
    formatId: "instagram-square",
    imageBrief:
      "Punchy square sale creative: coral field, lemon offer sticker, and one expressive fashion portrait.",
    imageStyle: "photorealistic",
    category: "Marketing",
    colors: ["#EF493D", "#FFF7E9", "#F8D74D"],
    layoutFamily: "boldBlock",
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
      libraryVisual(
        "people-half-body-curly",
        "Half-body portrait of a smiling model in a bright yellow top against a red backdrop",
      ),
    ),
  },
  {
    name: "Fashion Editorial",
    formatId: "instagram-post",
    imageBrief:
      "Quiet fashion cover with warm ivory, rust tailoring, layered condensed type, and generous magazine margins.",
    imageStyle: "photorealistic",
    category: "Social",
    colors: ["#EEE8DD", "#252521", "#B45E3D"],
    layoutFamily: "megaType",
    layout: megaType(
      {
        eyebrow: "Issue 07",
        note: "Autumn / Winter",
        title: "THE QUIET",
        sub: "SEASON",
        body: "Layered neutrals and soft tailoring\nfor the colder months",
        cta: "Read the issue",
      },
      libraryVisual(
        "people-half-body-woman",
        "Editorial half-body portrait of a woman in a rust knit, soft studio light, neutral backdrop",
      ),
    ),
  },
  {
    name: "Event Announcement",
    formatId: "x-post",
    imageBrief:
      "Wide summit announcement: condensed title at left, amber conference stage at right, crisp date and registration strip.",
    imageStyle: "photorealistic",
    category: "Events",
    colors: ["#121D2C", "#FFF7E8", "#EDAC55"],
    layoutFamily: "megaType",
    layout: megaType(
      {
        eyebrow: "Live · 14 Nov 2026",
        note: "San Francisco",
        title: "DESIGN SYSTEMS",
        sub: "SUMMIT 2026",
        body: "Pier 27 · 9 AM – 6 PM\n40 speakers, 12 workshops",
        cta: "Reserve a seat",
      },
      libraryVisual(
        "events-stage",
        "Audience facing a lit conference stage, warm amber spotlights, wide shot from the back of the room",
      ),
      { font: FONT.bebas, scene: true },
    ),
  },
  {
    name: "Minimal Quote",
    formatId: "instagram-square",
    imageBrief:
      "A quiet square editorial quote with one monochrome portrait, fine ink rules and ample cream negative space.",
    imageStyle: "photorealistic",
    category: "Quotes",
    colors: ["#F7F1E6", "#202322", "#BA523D"],
    layoutFamily: "newsprint",
    layout: newsprint(
      {
        eyebrow: "Vol. 18 · Studio Notes · Free",
        title: "The Daily Quote",
        sub: "“Make it simple, then make it matter.”",
        note: "Mara Ellison, designer and writer",
        body: "Less noise. More meaning.",
        cta: "Read more",
        badge: "Every Friday",
      },
      libraryVisual(
        "people-half-body-glasses",
        "Black-and-white portrait of a designer with glasses at her desk",
      ),
    ),
  },
  {
    name: "Business Card",
    formatId: "linkedin-post",
    imageBrief:
      "Professional landscape introduction with a small studio mark, precise contact column and electric blue side rule.",
    imageStyle: "vector",
    category: "Business",
    colors: ["#10263B", "#F6F8F5", "#65CCEE"],
    layoutFamily: "businessCard",
    layout: businessCard,
  },
  {
    name: "Restaurant Menu",
    formatId: "facebook-post",
    imageBrief:
      "Landscape bistro menu pairing a richly lit ceramic bowl with a readable seasonal menu and warm brass details.",
    imageStyle: "photorealistic",
    category: "Business",
    colors: ["#251C17", "#FFF4DE", "#D5A45E"],
    layoutFamily: "promoSplit",
    layout: promoSplit(
      {
        eyebrow: "Seasonal menu",
        title: "Olive & Ember",
        sub: "Wood-fired plates from the farms around us.",
        note: "Open daily · 12 – 10 PM · Book a table",
      },
      libraryVisual(
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
    formatId: "instagram-story",
    imageBrief:
      "Playful vertical birthday invitation with balloon cutouts, berry pink type and one lemon RSVP sticker.",
    imageStyle: "flat-illustration",
    category: "Events",
    colors: ["#F3A3BB", "#3C193F", "#F6DB69"],
    layoutFamily: "retroSticker",
    layout: retroSticker(
      {
        eyebrow: "You're invited",
        note: "18 · 10 · 2026",
        title: "MAYA TURNS 30!",
        badge: "RSVP by 10 Oct",
        body: "Saturday, 8 PM\nThe Loft, 214 Grand Street",
        cta: "I'll be there",
      },
      libraryVisual(
        "events-balloons",
        "Cluster of glossy balloons and confetti on a hot-pink backdrop",
      ),
    ),
  },
  {
    name: "Job Opening",
    formatId: "linkedin-post",
    imageBrief:
      "Wide recruiting announcement with a clear role headline, remote-work details and a three-panel team collage.",
    imageStyle: "photorealistic",
    category: "Business",
    colors: ["#133E38", "#F3F4E9", "#B8DE8C"],
    layoutFamily: "collage",
    layout: collage(
      {
        badge: "We're hiring",
        title: "SENIOR FRONTEND ENGINEER",
        sub: "Remote · Full-time · $150k – $180k",
        body: "Build the tools designers use every day.",
        cta: "Apply now",
      },
      [
        libraryVisual(
          "people-half-body-glasses",
          "Engineer with glasses smiling at her desk, natural office light",
        ),
        libraryVisual(
          "tech-laptop",
          "Laptop showing a code editor and a video call",
          { fit: "contain" },
        ),
        libraryVisual(
          "people-half-body-man",
          "Bearded team lead in a blazer, relaxed office portrait",
        ),
      ],
    ),
  },
  {
    name: "Webinar Promo",
    formatId: "youtube-thumbnail",
    imageBrief:
      "Readable video thumbnail with a short bold design-systems title, one laptop visual and a violet session label.",
    imageStyle: "photorealistic",
    category: "Marketing",
    colors: ["#F1EAFB", "#292344", "#8973DC"],
    layoutFamily: "editorialSerif",
    layout: editorialSerif(
      {
        eyebrow: "Free live webinar",
        note: "Thu 6 Nov · 11 AM PT",
        title: "Scaling Design Systems",
        sub: "tokens, governance and adoption",
        body: "A practical 60-minute session\nwith live Q&A.",
        cta: "Save my seat",
      },
      libraryVisual(
        "tech-laptop",
        "Laptop showing a video call with two speakers and presentation slides",
        { fit: "contain" },
      ),
    ),
  },
  {
    name: "Real Estate Listing",
    formatId: "facebook-post",
    imageBrief:
      "Wide property showcase with a warm daylight house photograph, terracotta price panel and concise viewing details.",
    imageStyle: "photorealistic",
    category: "Business",
    colors: ["#F8F0E4", "#292B28", "#B96140"],
    layoutFamily: "promoSplit",
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
      libraryVisual(
        "realestate-house",
        "Modern two-storey family home with a gabled roof and front garden at golden hour",
      ),
    ),
  },
  {
    name: "Fitness Class",
    formatId: "instagram-story",
    imageBrief:
      "Energetic vertical fitness story with a full-body athlete, lime-on-charcoal type and an unobstructed booking zone.",
    imageStyle: "photorealistic",
    category: "Lifestyle",
    colors: ["#172321", "#FAF6EC", "#C6F05F"],
    layoutFamily: "verticalType",
    layout: verticalType(
      {
        eyebrow: "Mondays · 7 AM",
        title: "POWER HOUR",
        sub: "45 minutes. Full body. All levels welcome.",
        cta: "Book a spot",
        note: "Studio 4 · Eastside",
      },
      libraryVisual(
        "people-active-man",
        "Athlete mid-jump with arms raised in orange activewear, dark studio, dramatic rim light",
      ),
    ),
  },
  {
    name: "Podcast Episode",
    formatId: "youtube-thumbnail",
    imageBrief:
      "High-contrast podcast thumbnail with oversized ivory headline, purple microphone lighting and a compact episode badge.",
    imageStyle: "cinematic",
    category: "Social",
    colors: ["#211636", "#FFF4E7", "#BC8ADE"],
    layoutFamily: "editorialSerif",
    layout: editorialSerif(
      {
        eyebrow: "Episode 42",
        note: "Out now",
        title: "Building in Public",
        sub: "with guest Dana Ortiz",
        body: "Why sharing early beats\nlaunching loud.",
        cta: "Listen now",
      },
      libraryVisual(
        "events-microphone",
        "Studio podcast microphone with purple backlight and soft haze",
        { fit: "contain" },
      ),
    ),
  },
  {
    name: "Coming Soon",
    formatId: "instagram-story",
    imageBrief:
      "Minimal midnight-blue vertical teaser with a small dimensional glass sculpture, spacious serif title and quiet waitlist CTA.",
    imageStyle: "photorealistic",
    category: "Marketing",
    colors: ["#0E1B2F", "#F7F3E9", "#8CCDD8"],
    layoutFamily: "spotlight",
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
    formatId: "instagram-square",
    imageBrief:
      "Square customer story with warm portraits, a single prominent quotation and a clear author credit.",
    imageStyle: "photorealistic",
    category: "Marketing",
    colors: ["#FFF0DE", "#442D26", "#B96A44"],
    layoutFamily: "collage",
    layout: collage(
      {
        badge: "Customer story",
        title: "“HALF THE TIME, TWICE THE CRAFT.”",
        sub: "Jordan Lee, Head of Design at Brightline",
        body: "How Brightline shipped its redesign in six weeks.",
        cta: "Read the story",
      },
      [
        libraryVisual(
          "people-half-body-man",
          "Warm portrait of a bearded design lead in a bright office",
        ),
        libraryVisual(
          "people-half-body-curly",
          "Designer with curly hair reviewing work on a wall",
        ),
        libraryVisual(
          "people-half-body-woman",
          "Product manager smiling during a team review",
        ),
      ],
    ),
  },
  {
    name: "Seasonal Sale",
    formatId: "instagram-story",
    imageBrief:
      "Vertical forest-green holiday offer with a decorated evergreen, warm cream type and a scarlet offer sticker.",
    imageStyle: "photorealistic",
    category: "Marketing",
    colors: ["#16483B", "#FFF6E6", "#DB4E4C"],
    layoutFamily: "boldBlock",
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
      libraryVisual(
        "seasonal-holiday",
        "Decorated evergreen with scarlet ribbon and a few handmade ornaments on a deep green backdrop",
      ),
    ),
  },
  {
    name: "Wedding Invitation",
    formatId: "whatsapp-status",
    imageBrief:
      "Elegant tall wedding stationery with olive floral corners, rose accents, script names and centered event details.",
    imageStyle: "watercolor",
    category: "Events",
    colors: ["#FAF5E9", "#3E4333", "#A66F78"],
    layoutFamily: "ornamentFrame",
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
    formatId: "whatsapp-status",
    imageBrief:
      "Gentle tall celebration with peach sunshine artwork, sky-blue details and playful restrained display type.",
    imageStyle: "flat-illustration",
    category: "Events",
    colors: ["#FBE7D8", "#334961", "#95BDD2"],
    layoutFamily: "retroSticker",
    layout: retroSticker(
      {
        eyebrow: "Baby shower",
        note: "09 · 11",
        title: "OH BABY, IT'S LEO!",
        badge: "Sunday 2 PM",
        body: "Hosted by Grace\n18 Willow Lane",
        cta: "RSVP to Grace",
      },
      libraryVisual(
        "seasonal-sun",
        "Gentle illustrated sunrise with rounded peach rays on a pastel blue backdrop",
      ),
    ),
  },
  {
    name: "Graduation Announcement",
    formatId: "whatsapp-status",
    imageBrief:
      "Tall navy graduation card with a gold tassel cap, fine gold frame and a spacious celebratory name.",
    imageStyle: "line-art",
    category: "Events",
    colors: ["#142C47", "#FFF6DB", "#DDBA6D"],
    layoutFamily: "ornamentFrame",
    layout: ornamentFrame(
      {
        eyebrow: "Class of 2026",
        title: "Congratulations, Sofia",
        sub: "Bachelor of Science in Architecture",
        body: "Ceremony · 30 May · 10 AM\nMain Quad, Westbrook University",
      },
      libraryVisual(
        "education-graduation",
        "Graduation cap with a gold tassel and a rolled diploma on navy",
      ),
      { ornament: "gold-frame", titleColor: "accent" },
    ),
  },
  {
    name: "Holiday Greeting Card",
    formatId: "whatsapp-status",
    imageBrief:
      "Warm burgundy family greeting with a small illustrated family portrait, champagne frame and elegant cream script.",
    imageStyle: "flat-illustration",
    category: "Social",
    colors: ["#682C39", "#FFF4DE", "#D4B472"],
    layoutFamily: "ornamentFrame",
    layout: ornamentFrame(
      {
        eyebrow: "Season's greetings",
        title: "Warm Wishes",
        sub: "for the holidays and the year ahead",
        body: "With love from the Carter family",
      },
      libraryVisual(
        "people-family",
        "Family of three in cosy knitwear beside a decorated evergreen tree",
      ),
      { ornament: "gold-frame", titleColor: "accent" },
    ),
  },
  {
    name: "New Year Countdown",
    formatId: "youtube-thumbnail",
    imageBrief:
      "Bold widescreen celebration thumbnail with gold fireworks, oversized countdown type and one midnight event detail.",
    imageStyle: "cinematic",
    category: "Social",
    colors: ["#111622", "#FFF9E9", "#E7BD65"],
    layoutFamily: "megaType",
    layout: megaType(
      {
        eyebrow: "31 December",
        note: "Rooftop · 11 PM",
        title: "COUNTDOWN",
        sub: "TO 2027",
        body: "Live DJ, skyline views\nand a midnight toast",
        cta: "Get tickets",
      },
      libraryVisual(
        "seasonal-fireworks",
        "Gold fireworks bursting over a night city skyline",
      ),
      { font: FONT.bebas, scene: true },
    ),
  },
  {
    name: "Recipe Card",
    formatId: "pinterest-pin",
    imageBrief:
      "Saveable long recipe pin with an overhead grain bowl, paprika headline, readable ingredients and generous kitchen-note spacing.",
    imageStyle: "photorealistic",
    category: "Lifestyle",
    colors: ["#FFF4DF", "#503D25", "#B94D32"],
    layoutFamily: "promoSplit",
    layout: promoSplit(
      {
        eyebrow: "Weeknight dinner · 25 min",
        title: "Roasted squash grain bowl",
        sub: "Farro, crispy chickpeas, tahini and a squeeze of lemon.",
        body: "• 1 cup farro\n• 1 small squash\n• 1 can chickpeas\n• 3 tbsp tahini",
        note: "Serves 4 · Vegetarian",
      },
      libraryVisual(
        "food-bowl",
        "Overhead shot of a grain bowl with roasted squash, chickpeas, and a tahini drizzle",
      ),
    ),
  },
  {
    name: "Travel Promo",
    formatId: "pinterest-pin",
    imageBrief:
      "Tall coastal travel pin with a panoramic island view, sea-blue accents and a compact package price.",
    imageStyle: "photorealistic",
    category: "Marketing",
    colors: ["#E9F4EF", "#173D48", "#3D9FAD"],
    layoutFamily: "promoSplit",
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
      libraryVisual(
        "travel-landscape",
        "Whitewashed village above a turquoise sea at sunset",
      ),
    ),
  },
  {
    name: "Music Concert Poster",
    formatId: "youtube-thumbnail",
    imageBrief:
      "Widescreen music thumbnail with a magenta performer silhouette, condensed cream title and one tour-date accent.",
    imageStyle: "cinematic",
    category: "Events",
    colors: ["#22152E", "#FFF0E1", "#E476B5"],
    layoutFamily: "boldBlock",
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
      libraryVisual(
        "people-profile-silhouette",
        "Dramatic side-profile silhouette of a singer under magenta stage light",
      ),
      { font: FONT.anton },
    ),
  },
  {
    name: "Yoga Retreat",
    formatId: "pinterest-pin",
    imageBrief:
      "Calm long wellness pin with a seated meditation figure, sage framing and a vertical serif headline.",
    imageStyle: "photorealistic",
    category: "Lifestyle",
    colors: ["#EFF0E1", "#344536", "#9BAD83"],
    layoutFamily: "verticalType",
    layout: verticalType(
      {
        eyebrow: "Weekend retreat",
        title: "Slow down",
        sub: "Three days of yoga, breathwork and forest walks.",
        cta: "Reserve your mat",
        note: "14 – 16 Nov · Sonoma",
      },
      libraryVisual(
        "people-seated",
        "Person meditating cross-legged on a mat in soft morning light among trees",
      ),
      { font: FONT.serif },
    ),
  },
  {
    name: "Book Launch",
    formatId: "pinterest-pin",
    imageBrief:
      "Long literary pin with a burgundy hardcover stack, quiet serif hierarchy, one review and a clear preorder button.",
    imageStyle: "photorealistic",
    category: "Marketing",
    colors: ["#F5EAE3", "#4C2034", "#AF5E73"],
    layoutFamily: "editorialSerif",
    layout: editorialSerif(
      {
        eyebrow: "New release",
        note: "In stores 3 March",
        title: "The Weight of Small Things",
        sub: "a novel by Elena Marsh",
        body: "“Quietly devastating.”\nThe Literary Review",
        cta: "Pre-order now",
      },
      libraryVisual(
        "education-books",
        "Hardcover novel with a deep red jacket standing on a stack of books",
        { fit: "contain" },
      ),
    ),
  },
  {
    name: "Startup Pitch Cover",
    formatId: "linkedin-post",
    imageBrief:
      "Wide investor cover with dark navy, electric mint accents, large Relay wordmark and a clean growth-chart panel.",
    imageStyle: "vector",
    category: "Business",
    colors: ["#101E30", "#EDF6EA", "#61CDB8"],
    layoutFamily: "editorialSerif",
    layout: editorialSerif(
      {
        eyebrow: "Seed round · 2026",
        note: "Confidential",
        title: "Relay",
        sub: "payments for creators",
        body: "Investor presentation\nQ4 2026",
      },
      libraryVisual(
        "finance-growth",
        "Clean upward growth chart on a dark dashboard",
        { fit: "contain" },
      ),
    ),
  },
  {
    name: "Newsletter Header",
    formatId: "x-post",
    imageBrief:
      "Wide cream-and-ink newsletter masthead, a dawn skyline panel and one concise weekly editorial deck.",
    imageStyle: "photorealistic",
    category: "Business",
    colors: ["#F7F2E5", "#25332E", "#3A648C"],
    layoutFamily: "newsprint",
    layout: newsprint(
      {
        eyebrow: "Issue 18 · September 2026",
        title: "The Weekly Grid",
        sub: "Design notes, tools, and one good idea every Friday.",
        note: "The city at dawn, from our studio roof",
        body: "One good idea. Five useful links. Every Friday.",
        cta: "Subscribe free",
        badge: "Free · Every Friday",
      },
      libraryVisual("travel-city", "City skyline at dawn with lit windows"),
    ),
  },
  {
    name: "Coupon Voucher",
    formatId: "instagram-square",
    imageBrief:
      "Square tangerine ticket with circular notches, an oversized discount and a legible coupon code.",
    imageStyle: "photorealistic",
    category: "Marketing",
    colors: ["#FFE7B0", "#43291C", "#D66137"],
    layoutFamily: "voucher",
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
    formatId: "instagram-post",
    imageBrief:
      "Portrait home-goods cover featuring ceramic greenery, amber fragrance and a camera in a warm three-frame object study.",
    imageStyle: "photorealistic",
    category: "Business",
    colors: ["#EEE7DB", "#302F27", "#A86C47"],
    layoutFamily: "collage",
    layout: collage(
      {
        badge: "AW 2026",
        title: "OBJECTS FOR LIVING",
        sub: "120 pieces for slower living",
        body: "Thoughtful objects for everyday rituals.",
        cta: "Browse the collection",
      },
      [
        libraryVisual(
          "scenes-plant-vase",
          "Eucalyptus stems in an earthy ceramic vase on a linen-covered plinth",
          { fit: "contain", focal: [0.5, 1] },
        ),
        libraryVisual(
          "fashion-perfume",
          "Amber glass diffuser bottle on a stone tray",
          { fit: "contain", focal: [0.5, 1] },
        ),
        libraryVisual(
          "tech-camera",
          "Compact cream camera with a tan strap on a wooden shelf",
          { fit: "contain", focal: [0.5, 1] },
        ),
      ],
    ),
  },
  {
    name: "Charity Fundraiser",
    formatId: "facebook-post",
    imageBrief:
      "Wide community appeal with hands holding a heart, a teal headline column and one clear meal-impact offer.",
    imageStyle: "photorealistic",
    category: "Events",
    colors: ["#145950", "#F5F5DF", "#E9C879"],
    layoutFamily: "boldBlock",
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
      libraryVisual(
        "health-heart",
        "Hands gently holding a heart, warm community volunteering scene",
      ),
      { font: FONT.anton },
    ),
  },
  {
    name: "Online Course Promo",
    formatId: "x-post",
    imageBrief:
      "Wide course announcement with a violet lightbulb study, strong serif headline and concise lesson and price details.",
    imageStyle: "photorealistic",
    category: "Marketing",
    colors: ["#F0EBFA", "#382955", "#9269BD"],
    layoutFamily: "editorialSerif",
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
      libraryVisual(
        "education-idea",
        "Glowing lightbulb with a violet filament on a soft lavender backdrop",
        { fit: "contain" },
      ),
    ),
  },
  {
    name: "App Launch",
    formatId: "x-post",
    imageBrief:
      "Wide planner-app launch with a clean phone UI on blue, a bold left headline and a compact download CTA.",
    imageStyle: "3d-render",
    category: "Marketing",
    colors: ["#152C4D", "#F2F4EB", "#80B5E9"],
    layoutFamily: "spotlight",
    layout: spotlight(
      {
        eyebrow: "Now on iOS & Android",
        note: "4.8 ★ · 12k reviews",
        title: "Plan less, live more",
        sub: "Tempo turns your to-dos into a calm daily rhythm.",
        cta: "Download free",
      },
      libraryVisual(
        "devices-phone-app",
        "Smartphone showing a clean planner app with a notification, glowing blue light",
      ),
      { font: FONT.bebas },
    ),
  },
  {
    name: "Anniversary Card",
    formatId: "whatsapp-status",
    imageBrief:
      "Blush tall anniversary stationery with floral corners, champagne flutes and a personal script dedication.",
    imageStyle: "watercolor",
    category: "Social",
    colors: ["#FBECE8", "#6E3347", "#BF6C80"],
    layoutFamily: "ornamentFrame",
    layout: ornamentFrame(
      {
        eyebrow: "Happy anniversary",
        title: "Ten Years of Us",
        sub: "here's to every adventure still ahead",
        body: "With all my love,\nSam",
      },
      libraryVisual(
        "food-celebration",
        "Two champagne flutes clinking with sparkles on a blush backdrop",
      ),
      { ornament: "floral-frame", titleColor: "accent" },
    ),
  },
  {
    name: "Motivational Poster",
    formatId: "pinterest-pin",
    imageBrief:
      "Saveable butter-yellow typographic pin with coral sticker accents, a small upward arrow and an oversized encouraging message.",
    imageStyle: "vector",
    category: "Quotes",
    colors: ["#F8D96F", "#302D27", "#C85665"],
    layoutFamily: "retroSticker",
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
    formatId: "linkedin-post",
    imageBrief:
      "Wide recruitment banner with a lilac team-portrait mosaic and a bold hiring headline with concise role details.",
    imageStyle: "photorealistic",
    category: "Business",
    colors: ["#EAE6F6", "#30354C", "#7F7CC5"],
    layoutFamily: "collage",
    layout: collage(
      {
        badge: "Join our team",
        title: "WE'RE HIRING",
        sub: "across design and engineering",
        body: "8 open roles · Remote-friendly\nGreat benefits",
        cta: "See open roles",
      },
      [
        libraryVisual(
          "people-half-body-curly",
          "Designer with curly hair smiling in a bright studio",
        ),
        libraryVisual(
          "people-half-body-man",
          "Engineer with a beard in a relaxed office portrait",
        ),
        libraryVisual(
          "people-half-body-woman",
          "Product manager with long hair laughing with colleagues",
        ),
      ],
    ),
  },
  {
    name: "M3 Product Spotlight",
    formatId: "instagram-post",
    imageBrief:
      "Tonal lilac product portrait with a frosted mist bottle, soft radial light and expressive Material-inspired serif type.",
    imageStyle: "photorealistic",
    category: "Material 3",
    colors: m3Colors("#6750A4"),
    styleKitSeed: "#6750A4",
    layoutFamily: "spotlight",
    layout: spotlight(
      {
        eyebrow: "Product spotlight",
        note: "$28",
        title: "Aura hydrating mist",
        sub: "A fine daily mist with hyaluronic acid and rosewater.",
        cta: "Buy now",
      },
      libraryVisual(
        "fashion-perfume",
        "Frosted spray bottle on a soft lilac pedestal, studio light",
      ),
    ),
  },
  {
    name: "M3 Event Poster",
    formatId: "x-post",
    imageBrief:
      "Wide teal tonal meetup creative with a rounded stage panel and clear community-event typography.",
    imageStyle: "photorealistic",
    category: "Material 3",
    colors: m3Colors("#006A6A"),
    styleKitSeed: "#006A6A",
    layoutFamily: "editorialSerif",
    layout: editorialSerif(
      {
        eyebrow: "Community meetup",
        note: "20 Nov · 6 PM",
        title: "Material Design Night",
        sub: "talks, demos and pizza",
        body: "Makers' Hall, Austin\nFree entry, limited seats",
        cta: "Register free",
      },
      libraryVisual(
        "events-stage",
        "Small meetup audience facing a speaker and slides, teal lighting",
      ),
      { radius: 48 },
    ),
  },
  {
    name: "M3 Seasonal Offer",
    formatId: "facebook-post",
    imageBrief:
      "Wide amber tonal member offer with a holiday-tree visual, rounded offer badge and a strong savings headline.",
    imageStyle: "photorealistic",
    category: "Material 3",
    colors: m3Colors("#8B5000"),
    styleKitSeed: "#8B5000",
    layoutFamily: "boldBlock",
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
      libraryVisual(
        "seasonal-holiday",
        "Small evergreen tree with amber ribbon on a warm tonal plinth, soft studio light",
      ),
    ),
  },
  {
    name: "M3 Editorial Cover",
    formatId: "instagram-post",
    imageBrief:
      "Portrait rose-tonal editorial cover with a tailored male portrait, large condensed title and generous cream type.",
    imageStyle: "photorealistic",
    category: "Material 3",
    colors: m3Colors("#984061"),
    styleKitSeed: "#984061",
    layoutFamily: "megaType",
    layout: megaType(
      {
        eyebrow: "Issue 12",
        note: "The color issue",
        title: "TONAL",
        sub: "LIVING",
        body: "How one seed color\nshapes a whole home",
        cta: "Read the issue",
      },
      libraryVisual(
        "people-half-body-man",
        "Editorial half-body portrait of a male model in a rose-toned blazer against a tonal backdrop",
      ),
    ),
  },
  {
    name: "M3 App Announcement",
    formatId: "linkedin-post",
    imageBrief:
      "Wide blue tonal app announcement with a wallpaper-themed phone, rounded panels and a clear update message.",
    imageStyle: "3d-render",
    category: "Material 3",
    colors: m3Colors("#375CA9"),
    styleKitSeed: "#375CA9",
    layoutFamily: "spotlight",
    layout: spotlight(
      {
        eyebrow: "What's new",
        note: "Version 5.0",
        title: "Dynamic color is here",
        sub: "Your app now adapts to your wallpaper and style.",
        cta: "Update now",
      },
      libraryVisual(
        "devices-phone-app",
        "Smartphone showing an app themed from the wallpaper's colors",
      ),
    ),
  },
  {
    name: "M3 Quote Card",
    formatId: "instagram-square",
    imageBrief:
      "Quiet sage-tonal square quote with expressive serif type, one small upward arrow and clean attribution.",
    imageStyle: "vector",
    category: "Material 3",
    colors: m3Colors("#4F6353"),
    styleKitSeed: "#4F6353",
    layoutFamily: "retroSticker",
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
    formatId: "tiktok-video",
    imageBrief:
      "Tall street-style cover: editable limestone street layers, a cream-blazer walking model, dark caption shade and safe social-title placement.",
    imageStyle: "photorealistic",
    category: "Social",
    colors: ["#172E2B", "#FFF4E6", "#D5AC8D"],
    layoutFamily: "modelFeedPost",
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
    formatId: "tiktok-video",
    imageBrief:
      "Tall skincare diary cover with separate bathroom, eucalyptus, pump and model layers; soft peach typography below the photo.",
    imageStyle: "photorealistic",
    category: "Lifestyle",
    colors: ["#F7EBDF", "#40342E", "#AD7159"],
    layoutFamily: "modelFeedPost",
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
    formatId: "tiktok-video",
    imageBrief:
      "Tall cafe cover with separate window light, greenery, mug and seated model layers; an espresso caption panel beneath.",
    imageStyle: "cinematic",
    category: "Social",
    colors: ["#EDE4D8", "#302820", "#A97752"],
    layoutFamily: "modelFeedPost",
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
    formatId: "tiktok-video",
    imageBrief:
      "Tall wellness cover with separate lakeside, shadow and athlete layers in two unequal frames and a clear lower caption zone.",
    imageStyle: "photorealistic",
    category: "Lifestyle",
    colors: ["#E4EDE3", "#23463C", "#759376"],
    layoutFamily: "modelFeedPost",
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
    formatId: "tiktok-video",
    imageBrief:
      "Tall travel diary cover with layered coastal architecture, a linen-dress model and a quiet terracotta caption card.",
    imageStyle: "cinematic",
    category: "Social",
    colors: ["#F1E9DD", "#294551", "#BB8165"],
    layoutFamily: "modelFeedPost",
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
    formatId: "instagram-story",
    imageBrief:
      "Vertical live-sound story with an amber-lit microphone, ink-blue stage glow and condensed type above a clear ticket CTA.",
    imageStyle: "cinematic",
    category: "Events",
    colors: ["#141E29", "#FAEDD9", "#DCA366"],
    layoutFamily: "spotlight",
    layout: spotlight(
      {
        eyebrow: "Live music",
        note: "Friday · 8 PM",
        title: "AFTER DARK",
        sub: "An intimate night of live sound.",
        cta: "Book a seat",
      },
      libraryVisual(
        "events-microphone",
        "Single studio microphone on a small dark stage in a warm amber spotlight, with a faint haze and no performer",
      ),
      { font: FONT.bebas },
    ),
  },
  {
    name: "Studio Workshop",
    formatId: "youtube-thumbnail",
    imageBrief:
      "Widescreen workshop thumbnail with a readable short headline, green-on-paper palette and a clean laptop design-canvas visual.",
    imageStyle: "photorealistic",
    category: "Business",
    colors: ["#EEEADD", "#244A3A", "#B67D52"],
    layoutFamily: "editorialSerif",
    layout: editorialSerif(
      {
        eyebrow: "North Studio",
        note: "Creative practice",
        title: "Make better things",
        sub: "A hands-on design workshop",
        body: "Ideas, sketches, and practical tools.\nSaturday · 10 AM",
        cta: "Save a place",
      },
      libraryVisual(
        "tech-laptop",
        "Minimal laptop showing a simple design canvas with geometric blocks, alongside a pencil and paper on a warm studio desk",
      ),
    ),
  },
  {
    name: "Sunday Market",
    formatId: "facebook-post",
    imageBrief:
      "Wide local-market announcement with bright illustrated produce, forest-green title and a simple terracotta visit CTA.",
    imageStyle: "flat-illustration",
    category: "Lifestyle",
    colors: ["#FAEACB", "#294D3D", "#CF7853"],
    layoutFamily: "promoSplit",
    layout: promoSplit(
      {
        eyebrow: "Fresh this week",
        title: "Sunday Market",
        sub: "Good food from local makers.",
        body: "Seasonal produce\nSmall-batch treats",
        cta: "Come by",
        note: "Sundays · 9 AM – 2 PM",
      },
      libraryVisual(
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
  return layoutForFormat(
    cfg.layout({ bg, ink, accent }),
    { bg, ink, accent },
    format,
    cfg.layoutFamily,
  )
    .filter((slot) => !(isTextKind(slot.kind) && !slot.content))
    .map((slot, i) => {
      const n = counts[slot.kind] ?? 0;
      counts[slot.kind] = n + 1;
      const base = createElement(slot.kind, format, n);
      const patch = templateAssetPatch(slot.assetId, slot.kind, format, {
        bg,
        ink,
        accent,
      });
      const el: SpecElement = {
        ...base,
        ...patch,
        style: { ...base.style, ...patch.style },
        constraint: {
          ...base.constraint,
          ...patch.constraint,
          ...slot.constraint,
        },
      };
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
      fitTemplateText(el);
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
    imageBrief: cfg?.imageBrief ?? "",
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
  document: createDocument(c.formatId, c.name, { brandKit: false }),
}));

export function matchesTemplateQuery(
  name: string,
  category: string,
  query: string,
  format?: Format,
) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  const haystack =
    `${name} ${category} ${format?.label ?? ""} ${format?.platform ?? ""} ${format?.id ?? ""}`.toLowerCase();
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
