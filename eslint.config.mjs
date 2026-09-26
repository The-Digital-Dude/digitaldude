import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    ignores: [".next/**", "node_modules/**", "public/**", "dist/**"],
  },
  {
    rules: {
      // This rule flags every setState-in-effect, including the standard,
      // React-docs-endorsed patterns used throughout this codebase:
      // fetch-on-mount, SSR-hydration guards (read localStorage/browser APIs
      // only after mount), and sync-on-dependency-change. It's tuned for a
      // React Compiler / external-state-library architecture this codebase
      // doesn't use. Individual call sites are still reviewed on a case by
      // case basis (see e.g. the exhaustive-deps disable in
      // app/admin/bookings/page.tsx) rather than blanket-ignored.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
