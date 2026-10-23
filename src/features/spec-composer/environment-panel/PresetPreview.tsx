/** Tiny scene illustrations: local, deterministic and readable at sidebar scale. */
export function PresetPreview({ id }: { id: string }) {
  return (
    <svg
      className="environment-preset-preview"
      viewBox="0 0 80 72"
      aria-hidden="true"
    >
      {id === "outdoor" ? (
        <>
          <path fill="#d5b186" d="M0 0h80v72H0z" />
          <circle cx="57" cy="19" r="10" fill="#f3d7a1" />
          <path fill="#82765c" d="M0 43 24 22 47 46 69 28 80 36v36H0z" />
          <path fill="#58634a" d="m0 53 22-12 32 15 26-12v28H0z" />
          <path
            stroke="#b8b07a"
            strokeWidth="2"
            d="m9 72 4-16m15 16-2-12m34 12 4-16"
          />
        </>
      ) : id === "indoor" ? (
        <>
          <path fill="#8e7964" d="M0 0h80v72H0z" />
          <path fill="#c9b89b" d="M0 50h80v22H0z" />
          <path fill="#ead9b9" d="M5 4h25v40H5z" />
          <path stroke="#ad9674" strokeWidth="2" d="M17 4v40M5 23h25" />
          <path fill="#4b5149" d="M25 37q0-6 6-6h20q6 0 6 6v22H25z" />
          <path fill="#65695c" d="M22 45h38v13H22z" />
          <path
            stroke="#3e4937"
            strokeWidth="3"
            d="M68 54V26m0 17-8-10m8 3 7-12"
          />
          <path fill="#a98666" d="M61 50h14l-3 14h-8z" />
        </>
      ) : id === "product-photography" ? (
        <>
          <path fill="#c9bba3" d="M0 0h80v72H0z" />
          <path fill="#dfd2ba" d="M0 47h80v25H0z" />
          <path fill="#efe1c8" d="m16 52 35-6 19 8-35 8z" />
          <path fill="#af9f83" d="m16 52 19 10v7l-19-10zm19 10 35-8v7l-35 8z" />
          <rect x="36" y="24" width="13" height="29" rx="3" fill="#30312d" />
          <path fill="#20211f" d="M39 16h7v11h-7z" />
          <path stroke="#ada389" d="M40 31v16" />
          <path
            stroke="#6d7961"
            strokeWidth="3"
            d="M8 46 4 16m4 18 9-13m-10 4L0 20"
          />
        </>
      ) : id === "abstract" ? (
        <>
          <path fill="#1c2029" d="M0 0h80v72H0z" />
          <path fill="#e75b48" d="M0 0h68Q34 17 30 72H0z" />
          <path fill="#963c3c" d="M0 35Q38 7 54 72H0z" />
          <path fill="#343d50" d="M80 7Q36 23 48 72h32z" />
          <path fill="#e68c71" d="M0 35Q24 16 34 38 19 28 0 48z" />
        </>
      ) : (
        <>
          <path fill="#8c877c" d="M0 0h80v72H0z" />
          <path fill="#ded8c9" d="M18 8h44v43q0 10 10 21H8q10-11 10-21z" />
          <path
            fill="#333635"
            d="M31 37q0-3 3-3h12q3 0 3 3v13H31zM29 47h22v6H29z"
          />
          <path stroke="#333635" strokeWidth="2" d="m32 52-3 12m18-12 3 12" />
          <path fill="#353735" d="M3 19h10v25H3zm64 0h10v25H67z" />
          <path stroke="#41443f" d="M8 44v21m64-21v21" />
        </>
      )}
    </svg>
  );
}
