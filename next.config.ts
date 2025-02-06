/* import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 
  
};

export default nextConfig;
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", 'avatars.githubusercontent.com', 'localhost'], // Add your allowed image hostnames here
  },
  /* Add other configuration options here if needed */
};

export default nextConfig;
