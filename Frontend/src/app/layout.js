import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'NexChat — Connect. Chat. Share.',
  description: 'A modern real-time messaging application with voice/video calls, group chats, statuses, and end-to-end encryption.',
  keywords: ['messaging', 'chat', 'real-time', 'NexChat'],
  authors: [{ name: 'NexChat Team' }],
  openGraph: {
    title: 'NexChat — Connect. Chat. Share.',
    description: 'Modern real-time messaging with voice/video calls and more.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="container">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
