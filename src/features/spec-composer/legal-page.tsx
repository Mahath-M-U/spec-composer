import { DiscoveryShell } from "./discovery";

export function LegalPage() {
  return (
    <DiscoveryShell>
      <div className="discovery-content legal-page">
        <header className="legal-page-heading">
          <p className="eyebrow">ABOUT</p>
          <h1>Legal &amp; credits</h1>
          <p>
            The short version of the notices that apply to Spec Composer. The
            LICENSE and ATTRIBUTIONS.md files in the source code have the full
            details.
          </p>
        </header>
        <section>
          <h2>License</h2>
          <p>
            Spec Composer is open-source software released under the MIT
            License. It is provided &ldquo;as is&rdquo;, without warranty of any
            kind; the license text is the authoritative version.
          </p>
        </section>
        <section>
          <h2>AI-generated images</h2>
          <p>
            The example images in the prompt gallery, the template previews and
            the app icon were generated with AI tools. They are illustrations,
            not photographs: the people, places and products shown are not real.
            AI images can contain mistakes or unintended similarities to
            existing works, so review them before reusing them.
          </p>
        </section>
        <section>
          <h2>Prompts and specs</h2>
          <p>
            Spec Composer builds prompts and DESIGN.md specs on your device from
            what you put on the canvas. It does not call any AI service. What an
            AI tool generates from them can be inaccurate or resemble existing
            work, so check the results before publishing or commercial use.
          </p>
        </section>
        <section>
          <h2>Your content</h2>
          <p>
            You are responsible for the images, logos, fonts, text and brand
            assets you add, for having the rights to use them, and for what you
            publish.
          </p>
        </section>
        <section>
          <h2>Third-party tools</h2>
          <p>
            Tools named in the app, such as ChatGPT, Gemini, Midjourney, Canva
            or Figma, are separate services with their own terms and privacy
            policies. Adding a tool only puts its name in your prompt; Spec
            Composer does not connect to it and never asks for an API key. Spec
            Composer is not affiliated with or endorsed by any of them.
          </p>
        </section>
        <section>
          <h2>Trademarks</h2>
          <p>
            Product names and logos shown in the app are trademarks of their
            respective owners, used only to identify each tool.
          </p>
        </section>
        <section>
          <h2>Demo content</h2>
          <p>
            Names, companies, email addresses, phone numbers, prices and
            products in templates and examples are fictional and for
            illustration only. Replace them before you publish a design.
          </p>
        </section>
        <section>
          <h2>Privacy</h2>
          <p>
            There is no account and no backend. Your designs, design kits and
            images are saved in this browser (encrypted where supported) and the
            app does not send them to a server. Typefaces load from Google
            Fonts, which receives standard requests from your browser. Clearing
            your browser data deletes your designs, so export anything you want
            to keep.
          </p>
        </section>
      </div>
    </DiscoveryShell>
  );
}
