import type { Format } from "./types";

/** Changes whenever the editable starter artwork or its generation prompt is redesigned. */
export const TEMPLATE_ARTWORK_REVISION = "library-native-v1";

export type TemplateImage = {
  artworkRevision?: string;
  sourceFormatId?: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  promptHash: string;
  imageStyle: string;
  model: string;
  generatedAt: string;
  status: "pilot" | "approved";
};

/** Same slug rule as prompts.json and the template style kit IDs. */
export const templateSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-");

export const templateImages: Readonly<Record<string, TemplateImage>> = {
  "product-launch": {
    src: "/template-cards/product-launch.webp",
    alt: "Plum skincare launch with a frosted serum bottle, Glow, bottled. headline and Shop the launch button.",
    width: 1092,
    height: 1440,
    promptHash:
      "1e428801a38ec94bbbd5297cfd18a0161ec3ad9337acb98e231076251c6eb209",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-23",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-post",
  },
  "flash-sale": {
    src: "/template-cards/flash-sale.webp",
    alt: "Coral square fashion sale with FLASH SALE headline, model portrait and lemon 50% OFF sticker.",
    width: 1254,
    height: 1254,
    promptHash:
      "1b52b18971ea58514c48c0b7569d00b955a5e407f5e53d7eb616de3277c203a4",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-23",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-square",
  },
  "fashion-editorial": {
    src: "/template-cards/fashion-editorial.webp",
    alt: "Warm ivory fashion editorial with a rust-clad model and THE QUIET SEASON headline.",
    width: 1092,
    height: 1440,
    promptHash:
      "abc9edc86369d19a5bee7d8649ff6afd2af51d131359556b9d29ea5891422030",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-23",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-post",
  },
  "event-announcement": {
    src: "/template-cards/event-announcement.webp",
    alt: "Wide Design Systems Summit 2026 announcement with amber conference stage and registration details.",
    width: 1672,
    height: 941,
    promptHash:
      "456289ed1bebb4eb8d9c0eb49ba655789d352cc160d916c24b6f0a43b8d3a6f6",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-23",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "x-post",
  },
  "minimal-quote": {
    src: "/template-cards/minimal-quote.webp",
    alt: "Cream square editorial quote reading Make it simple, then make it matter. with a monochrome designer portrait.",
    width: 1254,
    height: 1254,
    promptHash:
      "5ad7781ec1d4aa6482984123ad1aac30d1ac9d06e87fcb916ff1feef2f5e57d8",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-23",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-square",
  },
  "business-card": {
    src: "/template-cards/business-card.webp",
    alt: "Navy Northwind Studio introduction with Priya Raman name, Head of Product Design role and contact details.",
    width: 1254,
    height: 1254,
    promptHash:
      "310166cef64ccba6f6742239e9b2cca673fd0b7602b51bfa02d30fb3ad711bda",
    imageStyle: "vector",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-23",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "linkedin-post",
  },
  "restaurant-menu": {
    src: "/template-cards/restaurant-menu.webp",
    alt: "Olive & Ember menu with ceramic grain bowl, seasonal tagline and four aligned dish-and-price rows.",
    width: 1730,
    height: 909,
    promptHash:
      "43149c56dd341fb7859c867325eb7cf34629b4dffcac3e2b105f28a1ba09d318",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "facebook-post",
  },
  "party-invitation": {
    src: "/template-cards/party-invitation.webp",
    alt: "Pink vertical birthday invitation with MAYA TURNS 30! headline, balloons and lemon RSVP sticker.",
    width: 941,
    height: 1672,
    promptHash:
      "d10ed65c6219bdd1cbdfa89fcab1e4e960ba932daf5a0306c4a0834617935480",
    imageStyle: "flat-illustration",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-23",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-story",
  },
  "job-opening": {
    src: "/template-cards/job-opening.webp",
    alt: "Green recruiting design with Senior Frontend Engineer headline, remote role details and three-panel team collage.",
    width: 1254,
    height: 1254,
    promptHash:
      "d5980efb78e4c9ffe9b2afd3172fd156ec36d8775fbaa1d9af9651a579011220",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-23",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "linkedin-post",
  },
  "webinar-promo": {
    src: "/template-cards/webinar-promo.webp",
    alt: "Violet webinar thumbnail with Scaling Design Systems headline, laptop video call and session details.",
    width: 1672,
    height: 941,
    promptHash:
      "a120f7041664420450a4b071cd3fa2f851b57bd938cd482f1b7cfefac10baa70",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-23",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "youtube-thumbnail",
  },
  "real-estate-listing": {
    src: "/template-cards/real-estate-listing.webp",
    alt: "Warm property showcase with Modern family home headline, daylight house photograph and listing price.",
    width: 1730,
    height: 909,
    promptHash:
      "158aa8c77f06b07c16aa53d85f57e7b25bd960dac3fd4767aceab81bda82aea2",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-23",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "facebook-post",
  },
  "fitness-class": {
    src: "/template-cards/fitness-class.webp",
    alt: "Vertical POWER HOUR fitness story with a full-body athlete, lime accents and booking details.",
    width: 941,
    height: 1672,
    promptHash:
      "eae678b459d7569b13768645687d36b7b18832dc0ce91b2bdae3290a5ddab810",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-story",
  },
  "podcast-episode": {
    src: "/template-cards/podcast-episode.webp",
    alt: "Wide Building in Public podcast thumbnail with a purple-lit microphone and guest details.",
    width: 1672,
    height: 941,
    promptHash:
      "0094e5c0121b90b842583657cb7fa02ceb7466a1b0ce2b8f02312b00fdeaa241",
    imageStyle: "cinematic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "youtube-thumbnail",
  },
  "coming-soon": {
    src: "/template-cards/coming-soon.webp",
    alt: "Midnight-blue Coming Soon story with translucent glass sculpture, spacious serif title and waitlist button.",
    width: 941,
    height: 1672,
    promptHash:
      "8b681c6b5382785b3d9e9771bb874d9901d0257f1071f87470eee4b0732f8666",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-story",
  },
  "customer-testimonial": {
    src: "/template-cards/customer-testimonial.webp",
    alt: "Warm square customer story featuring Half the time, twice the craft. quotation, portraits and Jordan Lee attribution.",
    width: 1254,
    height: 1254,
    promptHash:
      "a26d81657bae8329f43f3511ce4ae359f21ba82ae385e4a450cddd63a657a023",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-square",
  },
  "seasonal-sale": {
    src: "/template-cards/seasonal-sale.webp",
    alt: "Forest-green GIFT SEASON story with a decorated evergreen, UP TO 40% offer and shopping button.",
    width: 941,
    height: 1672,
    promptHash:
      "6b8dd3480d9c7319e0ee312dfc14c4d903a9a56811122959cdce24dce537d7db",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-story",
  },
  "wedding-invitation": {
    src: "/template-cards/wedding-invitation.webp",
    alt: "Tall floral wedding invitation with Amara & Theo script names and centered ceremony details.",
    width: 941,
    height: 1672,
    promptHash:
      "f4285f672bdc391c0f252d78b947d7332f9b7ce39523b55051686ed346db44b0",
    imageStyle: "watercolor",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "whatsapp-status",
  },
  "baby-shower-invite": {
    src: "/template-cards/baby-shower-invite.webp",
    alt: "Peach and blue baby shower invitation with OH BABY, IT'S LEO! headline, sunshine illustration and RSVP details.",
    width: 941,
    height: 1672,
    promptHash:
      "95e9c367c26ae2aeacc733e032a07077b4454b068723b96fd90a1d467c5a8975",
    imageStyle: "flat-illustration",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "whatsapp-status",
  },
  "graduation-announcement": {
    src: "/template-cards/graduation-announcement.webp",
    alt: "Navy and gold graduation card with Congratulations, Sofia headline, tassel cap and ceremony details.",
    width: 941,
    height: 1672,
    promptHash:
      "db1931257803692fbadc8b35a0495059b27373e9e136a8d21f11c0335b099c07",
    imageStyle: "line-art",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "whatsapp-status",
  },
  "holiday-greeting-card": {
    src: "/template-cards/holiday-greeting-card.webp",
    alt: "Burgundy holiday greeting with Warm Wishes script headline, illustrated family and champagne frame.",
    width: 941,
    height: 1672,
    promptHash:
      "8f836e6dc0722ac5f27ccc0fd52d9e071f936b792ff6b3a1855c4b9cab050b7a",
    imageStyle: "flat-illustration",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "whatsapp-status",
  },
  "new-year-countdown": {
    src: "/template-cards/new-year-countdown.webp",
    alt: "Wide New Year celebration with COUNTDOWN TO 2027 headline, gold fireworks and rooftop event details.",
    width: 1672,
    height: 941,
    promptHash:
      "a5b906d89ed1eb76d11005f2c06bd26b5444dcea26e18fd8833a47ffebcf7daf",
    imageStyle: "cinematic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "youtube-thumbnail",
  },
  "recipe-card": {
    src: "/template-cards/recipe-card.webp",
    alt: "Tall Roasted squash grain bowl recipe pin with overhead food photograph and readable ingredient list.",
    width: 1024,
    height: 1536,
    promptHash:
      "a5f48283be1af03b488320fe1debb41e454b2b2f1299807c33ec964948f6bcea",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "pinterest-pin",
  },
  "travel-promo": {
    src: "/template-cards/travel-promo.webp",
    alt: "Tall Santorini in seven nights travel pin with a coastal village view, package price and trip details.",
    width: 1024,
    height: 1536,
    promptHash:
      "ad99d4f736cf971120002763eef3e4d1a84ac5ca9e2e0b6dd67deba754da4f1c",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "pinterest-pin",
  },
  "music-concert-poster": {
    src: "/template-cards/music-concert-poster.webp",
    alt: "Wide THE NIGHT OWLS concert artwork with a magenta performer silhouette and one-night-only tour details.",
    width: 1672,
    height: 941,
    promptHash:
      "e12070966cdf66cc9e8ef4b8d40c3d8c70b1ac2b2a247562829ba7e0f8027cb3",
    imageStyle: "cinematic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "youtube-thumbnail",
  },
  "yoga-retreat": {
    src: "/template-cards/yoga-retreat.webp",
    alt: "Sage wellness pin with Slow down headline, seated meditation figure and retreat booking details.",
    width: 1024,
    height: 1536,
    promptHash:
      "35381517f344fcec9530307b91ab0d658e4cd3e042e10597db09da7edc84d8f5",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "pinterest-pin",
  },
  "book-launch": {
    src: "/template-cards/book-launch.webp",
    alt: "Literary book-launch pin with The Weight of Small Things headline, burgundy book stack and preorder button.",
    width: 1024,
    height: 1536,
    promptHash:
      "3b9d786dd47db80d69b3e404520a5ab27c22385125b4ef5b9176a959843a4e0e",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "pinterest-pin",
  },
  "startup-pitch-cover": {
    src: "/template-cards/startup-pitch-cover.webp",
    alt: "Navy Relay startup pitch cover with payments for creators tagline and mint growth-chart panel.",
    width: 1254,
    height: 1254,
    promptHash:
      "c5136cf78d6ccf8a3dddee5d83463831f29b33f7877afd943054dfd5ee5c9f4b",
    imageStyle: "vector",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "linkedin-post",
  },
  "newsletter-header": {
    src: "/template-cards/newsletter-header.webp",
    alt: "Wide cream-and-ink newsletter header with The Weekly Grid masthead, dawn skyline and subscription button.",
    width: 1672,
    height: 941,
    promptHash:
      "a7d4841535ecfdda5d799cb3ddb9d8ff96bc3677ef90c299fd6514f9d15ad0ae",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "x-post",
  },
  "coupon-voucher": {
    src: "/template-cards/coupon-voucher.webp",
    alt: "Tangerine square coupon ticket with $20 OFF headline, THANKS20 code and circular edge notches.",
    width: 1254,
    height: 1254,
    promptHash:
      "07e6ff9b9e565743f238ac027f021e0483528ab996d0b46ec4f0b24ad03ea9df",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-square",
  },
  "product-catalog-cover": {
    src: "/template-cards/product-catalog-cover.webp",
    alt: "Warm portrait catalog cover with OBJECTS FOR LIVING headline and three object panels showing ceramic greenery, fragrance and camera.",
    width: 1092,
    height: 1440,
    promptHash:
      "03a078ee0281895bf12ac8bce2a2642f8d9776f3e14b77c6a5402d470e524bcb",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-post",
  },
  "charity-fundraiser": {
    src: "/template-cards/charity-fundraiser.webp",
    alt: "Teal charity appeal with EVERY MEAL MATTERS headline, hands holding a heart and family-meal impact offer.",
    width: 1730,
    height: 909,
    promptHash:
      "484550f4e63d88f1e1a3eaeb30f77745d5a8972ef78ef20f3857a641b1c1afc7",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "facebook-post",
  },
  "online-course-promo": {
    src: "/template-cards/online-course-promo.webp",
    alt: "Violet Design Thinking Fundamentals course announcement with lightbulb artwork, lesson details and $99 price.",
    width: 1672,
    height: 941,
    promptHash:
      "57656a8e583045a33e161a9bc98e8a03582479e683778c347885bb4713e8e66a",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "x-post",
  },
  "app-launch": {
    src: "/template-cards/app-launch.webp",
    alt: "Wide blue app launch with Plan less, live more headline, planner phone interface and download button.",
    width: 1672,
    height: 941,
    promptHash:
      "ace2217b4a034e181bdcafd5ff97463c829eabf086a0c929ae6731583d501e0a",
    imageStyle: "3d-render",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "x-post",
  },
  "anniversary-card": {
    src: "/template-cards/anniversary-card.webp",
    alt: "Blush anniversary card with Ten Years of Us script headline, floral corners and champagne flutes.",
    width: 941,
    height: 1672,
    promptHash:
      "cb8424a86458106861960f33ed2bf2e429b93993a5d2d19f1218ff7362c3d4d0",
    imageStyle: "watercolor",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "whatsapp-status",
  },
  "motivational-poster": {
    src: "/template-cards/motivational-poster.webp",
    alt: "Butter-yellow motivational pin reading SMALL STEPS STILL MOVE YOU FORWARD. with coral sticker accents and a small upward arrow.",
    width: 1024,
    height: 1536,
    promptHash:
      "c630e18b93f4b441d7e505b47208c01fdd7d769ba632071f61e0df5c3b925bbc",
    imageStyle: "vector",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "pinterest-pin",
  },
  "team-hiring-banner": {
    src: "/template-cards/team-hiring-banner.webp",
    alt: "Lilac recruitment design with WE'RE HIRING headline, team portrait mosaic and open-role details.",
    width: 1254,
    height: 1254,
    promptHash:
      "e4dea28b0b4997e99b8a3841a40a8331c0206795e541eae60eb7267d7a9cfe35",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "linkedin-post",
  },
  "m3-product-spotlight": {
    src: "/template-cards/m3-product-spotlight.webp",
    alt: "Tonal lilac product portrait with Aura hydrating mist headline, frosted mist bottle and Buy now button.",
    width: 1092,
    height: 1440,
    promptHash:
      "08843f13d3af183bde9dcba873416e0f2915a6336c73ad40a369e2e110e3b4d9",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-post",
  },
  "m3-event-poster": {
    src: "/template-cards/m3-event-poster.webp",
    alt: "Wide teal Material Design Night announcement with rounded conference-stage panel and community meetup details.",
    width: 1672,
    height: 941,
    promptHash:
      "ae783fefd793f1927c96e264dad6f36bbf775da235f09f947171e292acc4b086",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "x-post",
  },
  "m3-seasonal-offer": {
    src: "/template-cards/m3-seasonal-offer.webp",
    alt: "Wide amber member offer with SPRING OFFER headline, 25% OFF badge and ribbon-decorated evergreen.",
    width: 1730,
    height: 909,
    promptHash:
      "69f925648da3263590cafd2da0695dda4f521728e2730505e358e6e0b54c5e34",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "facebook-post",
  },
  "m3-editorial-cover": {
    src: "/template-cards/m3-editorial-cover.webp",
    alt: "Rose-tonal editorial cover with TONAL LIVING headline and a male model in a rose blazer.",
    width: 1092,
    height: 1440,
    promptHash:
      "ad2502f80f1e2a2beadab7f6d1ae719f8a31e34719e87e1d7ee8765cdb9da042",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-post",
  },
  "m3-app-announcement": {
    src: "/template-cards/m3-app-announcement.webp",
    alt: "Blue-tonal app announcement with Dynamic color is here headline, themed phone interface and update button.",
    width: 1254,
    height: 1254,
    promptHash:
      "1d20fd3bd7a9b035ff3d5be44e137b6d39d0e67a760221ad0e78cbe48cc82e96",
    imageStyle: "3d-render",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "linkedin-post",
  },
  "m3-quote-card": {
    src: "/template-cards/m3-quote-card.webp",
    alt: "Sage quote card reading Color is a power which directly influences the soul. with Kandinsky attribution and an upward arrow.",
    width: 1254,
    height: 1254,
    promptHash:
      "41f8b407e4317517ab86c07dde0ef053bf6424752218fb8aa4ea4044ab598240",
    imageStyle: "vector",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-square",
  },
  "street-style-fit-check": {
    src: "/template-cards/street-style-fit-check.webp",
    alt: "Tall street-style cover with today's fit headline, cream-blazer model crossing a limestone city street and quiet social caption.",
    width: 941,
    height: 1672,
    promptHash:
      "0230b05047e1dfebc2b3c497cd94b8763bc9d76a435dca83e5dfdda08d1d4832",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "tiktok-video",
  },
  "everyday-skincare": {
    src: "/template-cards/everyday-skincare.webp",
    alt: "Tall skincare diary with a softer morning headline, sunlit bathroom model, eucalyptus and pump bottle.",
    width: 941,
    height: 1672,
    promptHash:
      "8214f734f2a2d1ba0c3b08f5b772a1bfefacc42bb2195340ee8bde1e44429dbd",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "tiktok-video",
  },
  "cafe-morning": {
    src: "/template-cards/cafe-morning.webp",
    alt: "Tall cafe cover with coffee, then everything headline, a seated coffee drinker, warm window light and greenery.",
    width: 941,
    height: 1672,
    promptHash:
      "b571dcef0b959221bc820011f975f3ec573fd5179d325540ae2f4731a2a0e120",
    imageStyle: "cinematic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "tiktok-video",
  },
  "movement-club": {
    src: "/template-cards/movement-club.webp",
    alt: "Tall Movement Club cover with move at your pace headline, lakeside athlete scenes in two frames and a quiet wellness caption.",
    width: 941,
    height: 1672,
    promptHash:
      "3573f3b40ed66e42dd4a9e3fde1c05a6d98cbe3902f3b1459d05b536b948c857",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "tiktok-video",
  },
  "coastal-weekend": {
    src: "/template-cards/coastal-weekend.webp",
    alt: "Tall coastal diary cover with weekend notes headline, linen-dress model and golden seaside architecture.",
    width: 941,
    height: 1672,
    promptHash:
      "0040833bd10ee0e15a5bbc46a57e557d207912a2fdc7086be389f0bd4f2c8f8c",
    imageStyle: "cinematic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "tiktok-video",
  },
  "after-dark-sessions": {
    src: "/template-cards/after-dark-sessions.webp",
    alt: "Vertical AFTER DARK live-sound story with an amber-lit microphone, dark stage glow and ticket button.",
    width: 941,
    height: 1672,
    promptHash:
      "6ff75f58e549806c08a3a06522e0ab211d65f40515ea7dcda6200a009e56b759",
    imageStyle: "cinematic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "instagram-story",
  },
  "studio-workshop": {
    src: "/template-cards/studio-workshop.webp",
    alt: "Widescreen design workshop thumbnail with Make better things headline and a laptop showing a geometric design canvas.",
    width: 1672,
    height: 941,
    promptHash:
      "66aa8533abc6d9d9a554b9a9edf367493578beb1c413b60856c10aad98b30cc7",
    imageStyle: "photorealistic",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "youtube-thumbnail",
  },
  "sunday-market": {
    src: "/template-cards/sunday-market.webp",
    alt: "Wide Sunday Market announcement with bright illustrated produce, forest-green headline and green visit button.",
    width: 1731,
    height: 909,
    promptHash:
      "86849758257d4b6896b927520528db637a1a94f3fb156dd68ff8ab17fc2885ca",
    imageStyle: "flat-illustration",
    model: "OpenAI built-in image_gen",
    generatedAt: "2026-10-24",
    status: "approved",
    artworkRevision: "library-native-v1",
    sourceFormatId: "facebook-post",
  },
};

export function isCurrentTemplateImage(
  image: TemplateImage,
  format?: Pick<Format, "width" | "height"> & Partial<Pick<Format, "id">>,
): boolean {
  if (
    image.artworkRevision !== TEMPLATE_ARTWORK_REVISION ||
    image.status !== "approved" ||
    !Number.isFinite(image.width) ||
    !Number.isFinite(image.height) ||
    image.width <= 0 ||
    image.height <= 0
  )
    return false;
  if (!format) return true;
  if (
    !Number.isFinite(format.width) ||
    !Number.isFinite(format.height) ||
    format.width <= 0 ||
    format.height <= 0 ||
    (format.id !== undefined && image.sourceFormatId !== format.id)
  )
    return false;
  const actualRatio = image.width / image.height;
  const targetRatio = format.width / format.height;
  const nearSquare = Math.abs(targetRatio - 1) <= 0.08;
  const sameOrientation = actualRatio >= 1 === targetRatio >= 1;
  // Image generation may vary the pixel canvas modestly. Contain the original pixels; never crop or stretch them.
  return (
    (nearSquare || sameOrientation) &&
    Math.abs(actualRatio / targetRatio - 1) <= 0.08 + Number.EPSILON
  );
}

export function templateImageFor(
  name: string,
  format?: Pick<Format, "width" | "height"> & Partial<Pick<Format, "id">>,
): TemplateImage | undefined {
  const image = templateImages[templateSlug(name)];
  return image && isCurrentTemplateImage(image, format) ? image : undefined;
}
