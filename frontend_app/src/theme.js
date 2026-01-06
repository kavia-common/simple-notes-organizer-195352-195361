export const oceanProfessionalTheme = {
  name: "Ocean Professional",
  colors: {
    primary: "#2563EB",
    secondary: "#F59E0B",
    success: "#F59E0B",
    error: "#EF4444",
    background: "#f9fafb",
    surface: "#ffffff",
    text: "#111827",
  },
  radius: {
    sm: "10px",
    md: "14px",
    lg: "18px",
  },
  shadow: {
    sm: "0 1px 2px rgba(17, 24, 39, 0.06), 0 1px 1px rgba(17, 24, 39, 0.04)",
    md: "0 10px 20px rgba(17, 24, 39, 0.08), 0 2px 6px rgba(17, 24, 39, 0.06)",
  },
};

// PUBLIC_INTERFACE
export function applyThemeToDocument(theme) {
  /**
   * Applies theme tokens as CSS variables on the root element.
   * @param {typeof oceanProfessionalTheme} theme
   * @returns {void}
   */
  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.colors.primary);
  root.style.setProperty("--color-secondary", theme.colors.secondary);
  root.style.setProperty("--color-success", theme.colors.success);
  root.style.setProperty("--color-error", theme.colors.error);
  root.style.setProperty("--color-bg", theme.colors.background);
  root.style.setProperty("--color-surface", theme.colors.surface);
  root.style.setProperty("--color-text", theme.colors.text);
  root.style.setProperty("--radius-sm", theme.radius.sm);
  root.style.setProperty("--radius-md", theme.radius.md);
  root.style.setProperty("--radius-lg", theme.radius.lg);
  root.style.setProperty("--shadow-sm", theme.shadow.sm);
  root.style.setProperty("--shadow-md", theme.shadow.md);
}
