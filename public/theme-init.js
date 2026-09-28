(function () {
  try {
    var theme = localStorage.getItem("spec-composer-theme");
    if (theme !== "light" && theme !== "dark")
      theme = matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch (_) {
    /* Theme defaults to light when storage is blocked. */
  }
})();
