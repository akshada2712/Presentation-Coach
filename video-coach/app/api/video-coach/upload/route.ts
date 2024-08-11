// import { put } from '@vercel/blob';
// import { NextResponse } from 'next/server';

// export async function POST(request: Request): Promise<NextResponse> {
//   const { searchParams } = new URL(request.url);
//   const filename = searchParams.get('filename');

//   // ⚠️ The below code is for App Router Route Handlers only
//   const blob = await put(filename!, request.body!, {
//     access: 'public',
//   });

//   return NextResponse.json(blob);
// }

// export async function GET(request: Request): Promise<NextResponse> {
//   return NextResponse.json({ message: 'Hello' });
// }



import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname: string,
        /* clientPayload?: string, */
      ) => {
        // Generate a client token for the browser to upload the file

        // ⚠️ Authenticate users before generating the token.
        // Otherwise, you're allowing anonymous uploads.
        return {
          // allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif'],
          // tokenPayload: JSON.stringify({
          //   // optional, sent to your server on upload completion
          //   userId: user.id,
          // }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of client upload completion
        // ⚠️ This will not work on `localhost` websites,
        // Use ngrok or similar to get the full upload flow

        console.log('blob upload completed', blob, tokenPayload);

        try {
          // Run any logic after the file upload completed
          // const { userId } = JSON.parse(tokenPayload);
          // await db.update({ avatar: blob.url, userId });
        } catch (error) {
          throw new Error('Could not update user');
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }, // The webhook will retry 5 times waiting for a 200
    );
  }
}
