import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <>
      <Head>
        <title>Curiosity Invoicing | Sign In</title>
        <meta name="description" content="Sales document and customer management web app with AI & multilingual support" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Curiosity Invoicing</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create, manage, and send sales documents in multiple languages
            </p>
          </div>

          {status === 'loading' ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : status === 'unauthenticated' ? (
            <div className="space-y-6">
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-primary-400 group-hover:text-primary-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                  </svg>
                </span>
                Sign in with Google
              </button>
              <div className="text-center mt-4 text-xs text-gray-500">
                <p>Sign in to start managing your invoices and offers</p>
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="mt-12 max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Modern Invoicing with AI Assistance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-primary-600 text-lg mb-2">📄</div>
              <h3 className="font-semibold">Multilingual Documents</h3>
              <p className="text-sm text-gray-600">Create offers and invoices in multiple languages</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-primary-600 text-lg mb-2">🤖</div>
              <h3 className="font-semibold">AI-Powered</h3>
              <p className="text-sm text-gray-600">Let AI help you with content and workflow automation</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="text-primary-600 text-lg mb-2">💾</div>
              <h3 className="font-semibold">Cloud Integration</h3>
              <p className="text-sm text-gray-600">Automatic storage in Google Drive and email with Resend</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}