const fallbackApiUrl = 'http://localhost:4000';

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? fallbackApiUrl
};
