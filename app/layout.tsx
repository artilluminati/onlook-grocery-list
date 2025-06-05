import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';
export const metadata: Metadata = {
    title: '\u041A\u043E\u043D\u0441\u043A\u0438\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432',
    description:
        '\u041C\u0438\u043D\u0438-\u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u0432\u0435\u0434\u0435\u043D\u0438\u044F \u0441\u043F\u0438\u0441\u043A\u043E\u0432 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432',
    openGraph: {
        title: '\u041A\u043E\u043D\u0441\u043A\u0438\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432',
        description:
            '\u041C\u0438\u043D\u0438-\u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u0432\u0435\u0434\u0435\u043D\u0438\u044F \u0441\u043F\u0438\u0441\u043A\u043E\u0432 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432',
        url: 'http://localhost:3000',
        siteName:
            '\u041A\u043E\u043D\u0441\u043A\u0438\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432',
        type: 'website',
    },
    metadataBase: new URL('http://localhost:3000/'),
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" data-oid="i0m3ga9">
            <body className="" data-oid="etdeiza">
                {children}

                <Script src="/builtwith.js" strategy="afterInteractive" data-oid="2zk.8v:" />
            </body>
        </html>
    );
}
