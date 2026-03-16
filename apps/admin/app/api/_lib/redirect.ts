import { NextResponse } from 'next/server';

export function redirectRelative(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      location: path
    }
  });
}
