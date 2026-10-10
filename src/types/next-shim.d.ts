declare module 'next/server' {
  export class NextRequest extends Request {
    nextUrl: URL;
  }
  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse;
  }
}

declare module 'next/link' {
  import React from 'react';
  export default function Link(props: any): React.ReactElement;
}

declare module '@/lib/dbConnect' {
  export default function dbConnect(): Promise<any>;
}
