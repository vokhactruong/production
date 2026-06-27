import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduCenter - Nền tảng quản lý trung tâm giáo dục",
  description:
    "Quản lý học viên, lớp học, học phí, điểm danh, giáo viên và phụ huynh trên cùng một nền tảng duy nhất.",
};

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[100rem] items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900">EduCenter</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link href="/#tinh-nang" className="hover:text-blue-600 transition-colors">
            Tính năng
          </Link>
          <Link href="/#bang-gia" className="hover:text-blue-600 transition-colors">
            Bảng giá
          </Link>
          <Link href="/tin-tuc" className="hover:text-blue-600 transition-colors">
            Tin tức
          </Link>
          <Link href="/#ve-chung-toi" className="hover:text-blue-600 transition-colors">
            Về chúng tôi
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="http://localhost:5173"
            className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors sm:block"
          >
            Đăng nhập
          </Link>
          <Link
            href="/#bang-gia"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Dùng thử miễn phí
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-[100rem] px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">EduCenter</span>
            </div>
            <p className="text-sm leading-relaxed">
              Nền tảng quản lý trung tâm giáo dục toàn diện, giúp bạn vận hành hiệu quả và chuyên
              nghiệp hơn.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Sản phẩm</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#tinh-nang" className="hover:text-white transition-colors">
                  Tính năng
                </Link>
              </li>
              <li>
                <Link href="/#bang-gia" className="hover:text-white transition-colors">
                  Bảng giá
                </Link>
              </li>
              <li>
                <Link href="/#ve-chung-toi" className="hover:text-white transition-colors">
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Tài nguyên</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tin-tuc" className="hover:text-white transition-colors">
                  Tin tức & Blog
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Liên hệ</h4>
            <ul className="space-y-2 text-sm">
              <li>support@educenter.vn</li>
              <li>1800 9999</li>
              <li>Hà Nội, Việt Nam</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-8 text-center text-xs">
          © 2024 EduCenter. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-white text-slate-900 antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
