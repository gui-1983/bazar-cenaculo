/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "*.supabase.co";

const nextConfig = {
  reactStrictMode: true,
  images: {
    // As fotos já são comprimidas para WebP no upload, então não precisamos da
    // otimização da Vercel (que tem limite no plano grátis). unoptimized = servir direto.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }],
  },
};
export default nextConfig;
