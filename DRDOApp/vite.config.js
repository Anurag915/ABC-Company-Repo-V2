// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [tailwindcss(), react()],
  
// });


import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: "./", // ✅ Ensures relative paths (important for deployment behind Express)
  build: {
    outDir: "dist", // ✅ Ensure Vite builds to dist (default, but good to be explicit)
    emptyOutDir: true,
  },
});
