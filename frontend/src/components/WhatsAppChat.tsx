interface WhatsAppChatProps {
  /**
   * Phone number with country code, e.g. '+233 24 123 4567' or '233241234567'.
   * Can also be configured via VITE_WHATSAPP_NUMBER in .env.
   */
  phoneNumber?: string
  /**
   * Pre-filled message sent when the chat opens.
   */
  message?: string
}

export default function WhatsAppChat({
  phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '+233000000000',
  message = 'Hello Arc Optical Club! I would like to make an enquiry.',
}: WhatsAppChatProps) {
  // Strip non-digit characters for the wa.me link
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

  return (
    <aside
      aria-label="WhatsApp live chat"
      className="fixed bottom-6 right-3 z-50 sm:bottom-8 sm:right-8 lg:right-10"
    >
      {/* Floating WhatsApp chat button. */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Arc Optical Club on WhatsApp"
        title="Chat with us on WhatsApp"
        className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-[#20ba59] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        {/* Official WhatsApp SVG Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={0.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.277-.101-.478-.15-.678.15-.2.301-.777.98-.952 1.18-.176.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.5-1.787-1.676-2.088-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.3.3-.5.1-.2.05-.376-.025-.526-.075-.15-.678-1.634-.928-2.238-.244-.588-.493-.508-.678-.518l-.578-.01c-.2 0-.527.075-.803.376s-1.054 1.03-1.054 2.512c0 1.482 1.079 2.91 1.23 3.111.15.2 2.124 3.243 5.146 4.548.719.311 1.28.497 1.718.636.722.23 1.378.197 1.898.12.578-.087 1.78-.727 2.032-1.43.251-.703.251-1.304.175-1.43-.075-.126-.276-.201-.577-.351zM12.004 21.75c-1.758 0-3.48-.465-4.992-1.344l-.358-.212-3.714.974.991-3.619-.233-.371A9.708 9.708 0 0 1 2.25 12.04c0-5.385 4.381-9.767 9.767-9.767 2.61 0 5.064 1.016 6.91 2.863a9.715 9.715 0 0 1 2.854 6.897c0 5.386-4.381 9.768-9.777 9.768zm7.604-17.375A10.742 10.742 0 0 0 12.004 1.2C6.024 1.2 1.163 6.061 1.163 12.04c0 1.91.498 3.774 1.444 5.414L1 23l5.706-1.497a10.8 10.8 0 0 0 5.298 1.38h.005c5.979 0 10.841-4.861 10.841-10.84 0-2.898-1.129-5.624-3.242-7.668z" />
        </svg>
      </a>
    </aside>
  )
}