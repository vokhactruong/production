import Link from "next/link";
import { API_URL } from "./lib/api";
import type { Article } from "@school/types";

async function getLatestArticles() {
  try {
    const res = await fetch(`${API_URL}/articles/public?limit=3`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data: { items: Article[] } };
    return data.data.items;
  } catch {
    return [];
  }
}

// ── Hero ────────────────────────────────────────────────────────────────────

function DashboardMockup() {
  const bars = [40, 65, 50, 80, 60, 90, 70];
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-blue-600" />
          <span className="text-sm font-semibold text-slate-800">EduCenter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 rounded-full bg-slate-100" />
          <div className="h-6 w-6 rounded-full bg-slate-200" />
        </div>
      </div>

      <div className="flex">
        {/* sidebar */}
        <div className="hidden w-28 shrink-0 border-r border-slate-100 bg-slate-50 p-3 sm:block">
          {["Tổng quan", "Học viên", "Lớp học", "Giáo viên", "Điểm danh", "Học phí", "Báo cáo"].map(
            (item, i) => (
              <div
                key={item}
                className={`mb-1 rounded-lg px-2 py-1.5 text-xs ${i === 0 ? "bg-blue-600 font-medium text-white" : "text-slate-500"}`}
              >
                {item}
              </div>
            )
          )}
        </div>

        {/* content */}
        <div className="flex-1 p-4">
          <div className="mb-3 text-xs font-semibold text-slate-700">Tổng quan</div>

          {/* stats */}
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Học viên", value: "1,248", color: "text-blue-600" },
              { label: "Lớp học", value: "128", color: "text-indigo-600" },
              { label: "Tỉ lệ đi học", value: "92%", color: "text-emerald-600" },
              { label: "Doanh thu", value: "248.5M", color: "text-orange-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-slate-50 p-2.5">
                <div className="text-[10px] text-slate-400">{s.label}</div>
                <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] font-medium text-emerald-500">+12%</div>
              </div>
            ))}
          </div>

          {/* chart */}
          <div className="rounded-xl border border-slate-100 bg-white p-3">
            <div className="mb-2 text-[10px] font-medium text-slate-500">Doanh thu theo tháng</div>
            <div className="flex items-end gap-1 h-16">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 flex items-end">
                  <div
                    className="w-full rounded-t bg-blue-500 opacity-80"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[8px] text-slate-400">
              {["T1", "T2", "T3", "T4", "T5", "T6", "T7"].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>

          {/* bottom cards */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Học phí đến hạn", value: "23", sub: "Học viên cần đóng" },
              { label: "Học viên mới", value: "36", sub: "Trong tháng này" },
              { label: "Lớp sắp thiếu giảng", value: "8", sub: "Cần xử lý" },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-slate-100 p-2.5">
                <div className="text-[10px] text-slate-400">{c.label}</div>
                <div className="text-base font-bold text-slate-800">{c.value}</div>
                <div className="text-[10px] text-slate-400">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-slate-50 to-blue-50 pt-16 pb-20">
      <div className="mx-auto max-w-[100rem] px-6">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          {/* left */}
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Nền tảng quản lý trung tâm giáo dục toàn diện
            </div>

            <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Chuyển đổi trung tâm của bạn thành một{" "}
              <span className="text-blue-600">hệ thống quản lý hiện đại &amp; thông minh</span>
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Quản lý học viên, lớp học, học phí, điểm danh, giáo viên và phụ huynh trên cùng một
              nền tảng duy nhất.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/#bang-gia"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Dùng thử miễn phí 14 ngày →
              </Link>
              <Link
                href="/#lien-he"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Đặt lịch demo
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 lg:justify-start">
              {["Không cần thẻ tín dụng", "Thiết lập chỉ 5 phút", "Hủy bất kỳ lúc nào"].map((t) => (
                <span key={t} className="flex items-center gap-1">
                  <svg
                    className="h-3.5 w-3.5 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* right – dashboard mockup */}
          <div className="w-full max-w-lg flex-shrink-0 lg:w-[520px]">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Social proof ─────────────────────────────────────────────────────────────

function TrustSection() {
  const centers = [
    "Bright Future Learning",
    "Happy Kids Academy",
    "Connect English Center",
    "SmartMath Learning",
    "CodeForKid STEM",
    "Music Dream Academy",
  ];
  return (
    <section className="border-y border-slate-100 bg-white py-10">
      <div className="mx-auto max-w-[100rem] px-6">
        <p className="mb-8 text-center text-sm font-medium text-slate-400">
          Được tin dùng bởi hơn <span className="text-slate-700 font-semibold">500+</span> trung tâm
          giáo dục trên toàn quốc
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {centers.map((c) => (
            <span
              key={c}
              className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Problems ─────────────────────────────────────────────────────────────────

const problems = [
  {
    icon: (
      <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    title: "Quản lý thủ công, tốn thời gian",
    desc: "Sử dụng Excel, giấy tờ khiến việc quản lý nhiều thời gian và dễ sai sót.",
  },
  {
    icon: (
      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    title: "Theo dõi học phí khó khăn",
    desc: "Không nắm được ai đã đóng, ai còn nợ, ai sắp hết buổi học.",
  },
  {
    icon: (
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    ),
    title: "Điểm danh phức tạp",
    desc: "Giáo viên điểm danh thủ công, nhập vào Excel sau, dễ nhầm lẫn mỗi tiếng học.",
  },
  {
    icon: (
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
    title: "Lịch học dễ xung đột",
    desc: "Thay đổi lịch, đổi giáo viên dễ gây xung đột phòng học và thiếu thông báo.",
  },
  {
    icon: (
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    ),
    title: "Giao tiếp chưa hiệu quả",
    desc: "Thông báo thủ công qua điện thoại, phụ huynh không nhận được thông tin kịp thời.",
  },
  {
    icon: (
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
    title: "Thiếu báo cáo tức thời",
    desc: "Không có cái nhìn tổng quan để ra quyết định nhanh, chậm sát khách hàng.",
  },
];

function ProblemsSection() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-[100rem] px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Các vấn đề trung tâm thường gặp phải
          </h2>
          <p className="mt-3 text-slate-500">
            Chúng tôi hiểu những khó khăn bạn đang đối mặt mỗi ngày
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  {p.icon}
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">{p.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: (
      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
    title: "Quản lý học viên",
    desc: "Lưu trữ thông tin, lịch sử học tập, tình trạng và tiến độ học viên.",
  },
  {
    icon: (
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    ),
    title: "Điểm danh thông minh",
    desc: "Điểm danh bằng QR Code, tự động trừ buổi học, thông báo ngay cho phụ huynh.",
  },
  {
    icon: (
      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    title: "Quản lý học phí",
    desc: "Tính học phí, công nợ, nhắc đóng tiền. Hỗ trợ thanh toán online.",
  },
  {
    icon: (
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
    title: "Lịch học linh hoạt",
    desc: "Tạo thời khóa biểu, đổi lịch học, quản lý phòng học dễ dàng.",
  },
  {
    icon: (
      <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    ),
    title: "Thông báo tự động",
    desc: "Gửi thông báo qua Zalo, SMS, email đến phụ huynh tức thì.",
  },
  {
    icon: (
      <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    title: "Báo cáo & thống kê",
    desc: "Báo cáo doanh thu, học viên, điểm danh, công nợ chỉ với một click.",
  },
  {
    icon: <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    title: "Quản lý giáo viên",
    desc: "Theo dõi lịch dạy, điểm danh, khối lượng giảng dạy của giáo viên.",
  },
  {
    icon: (
      <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    ),
    title: "Ứng dụng phụ huynh",
    desc: "Phụ huynh theo dõi con em, điểm danh, học phí, thông báo dễ dàng.",
  },
  {
    icon: (
      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    ),
    title: "Phân quyền linh hoạt",
    desc: "Phân quyền chi tiết theo vai trò, bảo mật và an toàn dữ liệu.",
  },
];

function FeaturesSection() {
  return (
    <section id="tinh-nang" className="bg-white py-20">
      <div className="mx-auto max-w-[100rem] px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Tính năng cốt lõi</h2>
          <p className="mt-3 text-slate-500">
            Đầy đủ tính năng bạn cần để vận hành trung tâm hiệu quả
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 p-6 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  {f.icon}
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      num: "1",
      title: "Đăng ký tài khoản",
      desc: "Tạo tài khoản miễn phí chỉ trong 1 phút.",
    },
    {
      num: "2",
      title: "Thiết lập trung tâm",
      desc: "Thêm thông tin trung tâm, học viên, lớp học, giáo viên.",
    },
    {
      num: "3",
      title: "Bắt đầu quản lý",
      desc: "Quản lý mọi hoạt động từ một nền tảng duy nhất.",
    },
  ];

  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-[100rem] px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Bắt đầu chỉ với 3 bước đơn giản</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.num} className="relative flex flex-col items-center text-center">
              {i < steps.length - 1 && (
                <div className="absolute left-1/2 top-6 hidden h-0.5 w-full bg-blue-200 md:block" />
              )}
              <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-200">
                {s.num}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Why us ────────────────────────────────────────────────────────────────────

function WhyUsSection() {
  const reasons = [
    {
      icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
      title: "Tiết kiệm thời gian",
      desc: "Quản lý hiệu quả, tập trung vào giảng dạy.",
    },
    {
      icon: <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
      title: "Tăng doanh thu",
      desc: "Quản lý học phí hiệu quả, giảm thất thoát.",
    },
    {
      icon: (
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      ),
      title: "Giao tiếp hiệu quả",
      desc: "Kết nối chặt chẽ giữa trung tâm và phụ huynh.",
    },
    {
      icon: (
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      ),
      title: "Dữ liệu an toàn",
      desc: "Bảo mật cao, sao lưu tự động mỗi ngày.",
    },
    {
      icon: (
        <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      ),
      title: "Hỗ trợ tận tâm",
      desc: "Đội ngũ hỗ trợ 24/7, giải đáp nhanh chóng.",
    },
  ];

  return (
    <section id="ve-chung-toi" className="bg-white py-20">
      <div className="mx-auto max-w-[100rem] px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Vì sao hơn 500+ trung tâm tin chọn EduCenter?
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
          {reasons.map((r) => (
            <div key={r.title} className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  {r.icon}
                </svg>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">{r.title}</h3>
              <p className="text-xs leading-relaxed text-slate-500">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

function TestimonialsSection() {
  const reviews = [
    {
      name: "Nguyễn Thị Lan",
      role: "Giám đốc, Bright Future Center",
      stars: 5,
      text: "EduCenter giúp chúng tôi tiết kiệm 70% thời gian quản lý học viên và học phí. Công việc trở nên nhẹ nhàng hơn rất nhiều.",
    },
    {
      name: "Trần Văn Hùng",
      role: "Founder, Happy Kids Academy",
      stars: 5,
      text: "Phụ huynh rất hài lòng với ứng dụng. Họ luôn nhận được thông báo đầy đủ và cảm thấy yên tâm hơn với việc học của con.",
    },
    {
      name: "Lê Minh Tú",
      role: "Quản lý, Connect English Center",
      stars: 5,
      text: "Giao diện đẹp, dễ sử dụng. Báo cáo trực quan giúp tôi ra quyết định nhanh hơn và chính xác hơn.",
    },
  ];

  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-[100rem] px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Khách hàng nói gì về chúng tôi?</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <div key={r.name} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4 text-amber-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-600 italic">"{r.text}"</p>
              <div>
                <div className="text-sm font-semibold text-slate-900">— {r.name}</div>
                <div className="text-xs text-slate-400">{r.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function PricingSection() {
  const plans = [
    {
      name: "Cơ bản",
      price: "390.000đ",
      period: "/tháng",
      desc: "Dành cho trung tâm nhỏ",
      highlight: false,
      features: [
        "Tối đa 200 học viên",
        "Tất cả tính năng cơ bản",
        "Hỗ trợ email",
        "Báo cáo cơ bản",
      ],
      cta: "Dùng thử miễn phí",
    },
    {
      name: "Phổ biến",
      price: "790.000đ",
      period: "/tháng",
      desc: "Dành cho trung tâm lớn",
      highlight: true,
      features: [
        "Tối đa 1000 học viên",
        "Tất cả tính năng nâng cao",
        "Hỗ trợ ưu tiên",
        "Báo cáo nâng cao",
        "Ứng dụng phụ huynh",
      ],
      cta: "Dùng thử miễn phí",
    },
    {
      name: "Doanh nghiệp",
      price: "1.490.000đ",
      period: "/tháng",
      desc: "Dành cho chuỗi trung tâm",
      highlight: false,
      features: [
        "Không giới hạn học viên",
        "Tất cả tính năng",
        "Hỗ trợ 24/7",
        "Báo cáo theo yêu cầu",
        "Triển khai riêng",
      ],
      cta: "Liên hệ tư vấn",
    },
  ];

  return (
    <section id="bang-gia" className="bg-white py-20">
      <div className="mx-auto max-w-[100rem] px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Bảng giá</h2>
          <p className="mt-3 text-slate-500">Chọn gói phù hợp với quy mô trung tâm của bạn</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-7 ${
                p.highlight
                  ? "border-blue-500 bg-blue-600 text-white shadow-xl shadow-blue-200"
                  : "border-slate-200 bg-white"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-slate-900">
                  Phổ biến nhất
                </div>
              )}
              <div
                className={`mb-1 text-sm font-medium ${p.highlight ? "text-blue-100" : "text-slate-500"}`}
              >
                {p.desc}
              </div>
              <div
                className={`mb-1 text-xl font-bold ${p.highlight ? "text-white" : "text-slate-900"}`}
              >
                {p.name}
              </div>
              <div className="mb-6 flex items-baseline gap-1">
                <span
                  className={`text-3xl font-bold ${p.highlight ? "text-white" : "text-slate-900"}`}
                >
                  {p.price}
                </span>
                <span className={`text-sm ${p.highlight ? "text-blue-100" : "text-slate-400"}`}>
                  {p.period}
                </span>
              </div>

              <ul className="mb-8 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg
                      className={`h-4 w-4 shrink-0 ${p.highlight ? "text-blue-200" : "text-blue-500"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className={p.highlight ? "text-blue-50" : "text-slate-600"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/#lien-he"
                className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                  p.highlight
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

function FaqSection() {
  const faqs = [
    {
      q: "Dữ liệu của tôi có được bảo mật không?",
      a: "Có. Chúng tôi sử dụng mã hóa SSL 256-bit, sao lưu tự động hàng ngày và hệ thống bảo mật đạt chuẩn quốc tế.",
    },
    {
      q: "Tôi có thể dùng thử miễn phí trong bao lâu?",
      a: "Bạn có thể dùng thử đầy đủ tính năng trong 14 ngày hoàn toàn miễn phí, không cần thẻ tín dụng.",
    },
    {
      q: "EduCenter có hỗ trợ điện thoại không?",
      a: "Có. Chúng tôi hỗ trợ qua điện thoại, Zalo, email 24/7. Gói Doanh nghiệp có hỗ trợ riêng.",
    },
    {
      q: "Tôi có thể import dữ liệu từ Excel không?",
      a: "Có. EduCenter hỗ trợ import danh sách học viên, giáo viên và lớp học từ file Excel chỉ với vài bước đơn giản.",
    },
    {
      q: "Nếu cần hỗ trợ tôi liên hệ ở đâu?",
      a: "Bạn có thể liên hệ qua email support@educenter.vn, hotline 1800 9999 hoặc chat trực tiếp trên hệ thống.",
    },
  ];

  return (
    <section id="faq" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Câu hỏi thường gặp</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                {f.q}
                <svg
                  className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-5 pb-4 text-sm leading-relaxed text-slate-500">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Latest News ───────────────────────────────────────────────────────────────

function NewsSection({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-[100rem] px-6">
        <div className="mb-10 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-slate-900">Tin tức mới nhất</h2>
          <Link
            href="/tin-tuc"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
            >
              {article.thumbnail ? (
                <img
                  src={article.thumbnail}
                  alt={article.title}
                  className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="h-48 w-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <svg
                    className="h-12 w-12 text-blue-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                </div>
              )}
              <div className="p-5">
                {article.category && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {article.category.name}
                  </span>
                )}
                <h3 className="mt-2 font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{article.excerpt}</p>
                )}
                <Link
                  href={`/bai-viet/${article.slug}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Đọc thêm
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section id="lien-he" className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20 text-white">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Sẵn sàng chuyển đổi trung tâm của bạn?</h2>
        <p className="mt-4 text-lg text-blue-100">
          Tham gia cùng hơn 500+ trung tâm đã và đang sử dụng EduCenter để vận hành hiệu quả và
          chuyên nghiệp hơn mỗi ngày.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/#bang-gia"
            className="rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
          >
            Dùng thử miễn phí 14 ngày
          </Link>
          <Link
            href="mailto:support@educenter.vn"
            className="rounded-xl border border-white/30 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Đặt lịch demo
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const articles = await getLatestArticles();

  return (
    <main>
      <HeroSection />
      <TrustSection />
      <ProblemsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <WhyUsSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <NewsSection articles={articles} />
      <CtaSection />
    </main>
  );
}
