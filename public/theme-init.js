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
  var primaryColor = "red";
  try {
    var storedColor = localStorage.getItem("spec-composer-primary-color");
    if (["red", "amber", "green", "blue", "violet"].includes(storedColor))
      primaryColor = storedColor;
  } catch (_) {
    /* Primary color defaults to red when storage is blocked. */
  }
  document.documentElement.setAttribute("data-primary-color", primaryColor);
})();
