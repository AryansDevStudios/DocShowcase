'use client';

import { usePathname } from 'next/navigation';

export default function AppFooter() {
  const pathname = usePathname();

  // Don't show footer on the share page or if the view page is showing HTML
  if (pathname.startsWith('/share/') || (pathname.startsWith('/view/') && document.body.querySelector('iframe'))) {
    return null;
  }
  
  const isHtmlView = pathname.startsWith('/view/') && typeof window !== 'undefined' && window.document.querySelector('iframe') !== null;

  if (isHtmlView) {
      return null;
  }
  
  return (
    <footer className="flex py-6 w-full shrink-0 items-center justify-center px-4 md:px-6 border-t">
      <p className="text-sm bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent inline-block font-semibold">
        Website built under AryansDevStudios.
      </p>
    </footer>
  );
}
