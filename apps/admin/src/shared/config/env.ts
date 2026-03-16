const fallbackPublicApiUrl = 'http://localhost:4000';
const fallbackServerApiUrl = 'http://localhost:4000';

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? fallbackPublicApiUrl,
  apiServerUrl:
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? fallbackServerApiUrl
};
