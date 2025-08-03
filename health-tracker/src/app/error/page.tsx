'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The sign in link is no longer valid.';
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL.';
      case 'OAuthCallback':
        return 'Error in handling the response from OAuth provider.';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth provider user in the database.';
      case 'EmailCreateAccount':
        return 'Could not create email provider user in the database.';
      case 'Callback':
        return 'Error in the OAuth callback handler route.';
      case 'OAuthAccountNotLinked':
        return 'Email on the account is already linked, but not with this OAuth account.';
      case 'EmailSignin':
        return 'Check your email address.';
      case 'CredentialsSignin':
        return 'Sign in failed. Check the details you provided are correct.';
      default:
        return 'Unable to sign in.';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 p-6 text-center">
        <h1 className="text-2xl font-bold">Authentication Error</h1>
        <p className="text-muted-foreground">{getErrorMessage()}</p>
        
        {error === 'OAuthCallback' && (
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-semibold">Common causes:</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• Invalid OAuth client configuration</li>
              <li>• Mismatched redirect URIs</li>
              <li>• Expired or invalid credentials</li>
            </ul>
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/login">Try Again</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}