export function NaverLoginButton() {
  return (
    <a
      href="/api/auth/naver"
      className="flex items-center justify-center gap-2 bg-[#03C75A] px-7 py-3.5 text-[11px] font-bold tracking-[0.12em] text-white uppercase transition-opacity hover:opacity-90"
    >
      <span className="text-sm font-black">N</span>
      Continue with Naver
    </a>
  );
}
