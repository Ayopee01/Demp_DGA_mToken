/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/test2',
  assetPrefix: '/test2',   // ให้ไฟล์ js/css โหลดจาก /test2/_next/...
  output: 'standalone',    // ถ้าใช้ Docker แนะนำให้ใส่
};

module.exports = nextConfig;
