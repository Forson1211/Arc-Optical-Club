import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, LoaderCircle, UserCheck } from 'lucide-react'
import { isAxiosError } from 'axios'
import Container from '../components/Container'
import { api, apiErrorMessage } from '../lib/api'

const interests = [
  'Community outreach',
  'Eye-health education',
  'Research & learning',
  'Fundraising & partnerships',
  'Communications & design',
]

const inputClass =
  'min-h-12 w-full min-w-0 border border-transparent bg-slate-100 px-4 py-3 text-base text-arc-navy placeholder:text-slate-400 transition-all focus:border-arc-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-arc-blue/15'

type FieldErrors = Record<string, string[] | undefined>

export default function Join() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [errorMessage, setErrorMessage] = useState('')
  const [reference, setReference] = useState('')
  const successRef = useRef<HTMLDivElement>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return
    const form = event.currentTarget
    const data = new FormData(form)
    const value = (name: string) => String(data.get(name) || '').trim()
    const selectedInterests = data.getAll('interests').map(String)

    if (!selectedInterests.length) {
      setErrors({ interests: ['Please select at least one area where you would like to contribute.'] })
      return
    }

    setErrors({})
    setErrorMessage('')
    setStatus('sending')

    try {
      const { data: response } = await api.post<{ success: boolean; data: { id: string } }>('/join', {
        name: value('name'),
        email: value('email'),
        phone: value('phone'),
        location: value('location'),
        role: value('role'),
        organization: value('organization'),
        interests: selectedInterests,
        availability: value('availability'),
        motivation: value('motivation'),
        consent: data.get('consent') === 'on',
        website: value('website'),
      })

      if (!response.success) throw new Error('Application could not be saved.')
      setReference(response.data.id)
      form.reset()
      setStatus('success')
      requestAnimationFrame(() => successRef.current?.focus())
    } catch (error) {
      const fieldErrors = isAxiosError(error) ? error.response?.data?.errors?.fieldErrors : undefined
      setErrors(fieldErrors || {})
      setErrorMessage(
        apiErrorMessage(error, 'We could not complete your registration. Please check the highlighted fields.')
      )
      setStatus('error')
    }
  }

  return (
    <main className="bg-[#10394B] pb-20 sm:pb-28">
      {/* Top Banner with Team Photo and Gradient Overlay */}
      <section
        className="relative overflow-hidden pb-36 pt-14 text-center text-white sm:pb-40 sm:pt-16"
        aria-labelledby="join-heading"
      >
        <img
          src="/images/join-team-hero.jpg"
          alt="Arc Optical Club Team"
          className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,106,171,0.94),rgba(20,43,59,0.76)_65%,rgba(183,134,0,0.8))]" />
        <Container className="relative">
          <h1 id="join-heading" className="text-4xl font-extrabold uppercase tracking-[-0.04em] sm:text-5xl">
            Join Us Now!
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/90 sm:text-[15px]">
            Whether you study eye care, work in it, or simply care about sight, there is a place for you. Tell us about yourself and we will get back to you.
          </p>
        </Container>
      </section>

      {/* Main Registration Form Card */}
      <Container className="relative z-10 -mt-24 max-w-[920px]">
        <div className="bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-10 md:p-12">
          {status === 'success' ? (
            <div ref={successRef} tabIndex={-1} role="status" className="flex flex-col items-center py-6 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={36} strokeWidth={2} />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold tracking-[-0.03em] text-arc-navy sm:text-3xl">
                Registration Submitted Successfully!
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-arc-slate">
                Thank you for signing up to join Arc Optical Club. Your application has been received and our team will
                review your details and reach out shortly.
              </p>

              {reference && (
                <div className="mt-6 w-full max-w-md bg-slate-50 p-4 text-left">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Registration Reference
                  </span>
                  <strong className="mt-1 block font-mono text-base font-bold text-arc-navy">{reference}</strong>
                  <small className="mt-1 block text-xs text-slate-500">
                    Keep this reference ID for any future communications about your membership.
                  </small>
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  to="/programs"
                  className="inline-flex items-center gap-2 bg-arc-blue px-6 py-3 text-xs font-bold text-white transition hover:bg-[#01598f]"
                >
                  Explore our programs <ArrowRight size={14} />
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center bg-slate-100 px-6 py-3 text-xs font-semibold text-arc-slate transition hover:text-arc-navy"
                >
                  Back to homepage
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Form Card Header */}
              <div className="border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center bg-arc-blue/10 text-arc-blue">
                    <UserCheck size={22} />
                  </span>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-arc-navy sm:text-3xl">
                      Registration Details
                    </h2>
                    <p className="mt-0.5 text-sm text-arc-slate">
                      Please fill in your details accurately. Fields marked with an asterisk (
                      <span className="text-red-500">*</span>) are required.
                    </p>
                  </div>
                </div>
              </div>

              {/* Registration Form */}
              <form onSubmit={submit} className="mt-8">
                <fieldset disabled={status === 'sending'} className="grid gap-8 disabled:opacity-70">
                  {/* Section 1: Personal Details */}
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="text-sm font-extrabold uppercase tracking-wider text-arc-blue">01</span>
                      <h3 className="text-base font-bold text-arc-navy">Personal Information</h3>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      {/* Name */}
                      <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-arc-slate">
                        <span>
                          Full Name <span className="text-red-500">*</span>
                        </span>
                        <input
                          name="name"
                          placeholder="Your full name"
                          required
                          minLength={2}
                          maxLength={120}
                          autoComplete="name"
                          className={inputClass}
                        />
                        {errors.name && <span className="text-xs text-red-600">{errors.name[0]}</span>}
                      </label>

                      {/* Email */}
                      <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-arc-slate">
                        <span>
                          Email Address <span className="text-red-500">*</span>
                        </span>
                        <input
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          required
                          maxLength={180}
                          autoComplete="email"
                          className={inputClass}
                        />
                        {errors.email && <span className="text-xs text-red-600">{errors.email[0]}</span>}
                      </label>

                      {/* Phone */}
                      <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-arc-slate">
                        <span>
                          Phone Number <span className="text-red-500">*</span>
                        </span>
                        <input
                          name="phone"
                          type="tel"
                          placeholder="e.g. +233 24 000 0000"
                          required
                          minLength={7}
                          maxLength={40}
                          autoComplete="tel"
                          className={inputClass}
                        />
                        {errors.phone && <span className="text-xs text-red-600">{errors.phone[0]}</span>}
                      </label>

                      {/* Location */}
                      <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-arc-slate">
                        <span>
                          City / Town & Country <span className="text-red-500">*</span>
                        </span>
                        <input
                          name="location"
                          placeholder="e.g. Kumasi, Ghana"
                          required
                          minLength={2}
                          maxLength={160}
                          autoComplete="address-level2"
                          className={inputClass}
                        />
                        {errors.location && <span className="text-xs text-red-600">{errors.location[0]}</span>}
                      </label>
                    </div>
                  </div>

                  {/* Section 2: Background & Availability */}
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="text-sm font-extrabold uppercase tracking-wider text-arc-blue">02</span>
                      <h3 className="text-base font-bold text-arc-navy">Background & Availability</h3>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      {/* Role */}
                      <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-arc-slate">
                        <span>
                          Which best describes you? <span className="text-red-500">*</span>
                        </span>
                        <select name="role" required defaultValue="" className={inputClass}>
                          <option value="" disabled>
                            Select your background
                          </option>
                          {['Student', 'Eye-care professional', 'Other professional', 'Community volunteer'].map(
                            (role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            )
                          )}
                        </select>
                        {errors.role && <span className="text-xs text-red-600">{errors.role[0]}</span>}
                      </label>

                      {/* Organization / School */}
                      <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-arc-slate">
                        <span>
                          School / Organization / Workplace <span className="font-normal text-slate-400">(optional)</span>
                        </span>
                        <input
                          name="organization"
                          placeholder="Where you study or work"
                          maxLength={180}
                          autoComplete="organization"
                          className={inputClass}
                        />
                        {errors.organization && (
                          <span className="text-xs text-red-600">{errors.organization[0]}</span>
                        )}
                      </label>

                      {/* Availability */}
                      <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-arc-slate sm:col-span-2">
                        <span>
                          When are you usually available? <span className="text-red-500">*</span>
                        </span>
                        <select name="availability" required defaultValue="" className={inputClass}>
                          <option value="" disabled>
                            Select your general availability
                          </option>
                          <option value="Weekends">Weekends</option>
                          <option value="Weekdays">Weekdays</option>
                          <option value="Flexible / occasional">Flexible / occasional</option>
                        </select>
                        {errors.availability && (
                          <span className="text-xs text-red-600">{errors.availability[0]}</span>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Section 3: Areas of Interest */}
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="text-sm font-extrabold uppercase tracking-wider text-arc-blue">03</span>
                      <h3 className="text-base font-bold text-arc-navy">
                        Areas of Interest <span className="text-red-500">*</span>
                      </h3>
                    </div>
                    <p className="text-sm text-arc-slate">
                      Select all departments and activities where you would like to volunteer or contribute:
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {interests.map((interest) => (
                        <label
                          key={interest}
                          className="flex cursor-pointer items-center gap-2.5 bg-slate-100 px-4 py-3.5 text-sm font-semibold text-arc-navy transition hover:bg-slate-200 has-[:checked]:bg-arc-blue has-[:checked]:text-white"
                        >
                          <input
                            type="checkbox"
                            name="interests"
                            value={interest}
                            className="h-4 w-4 accent-arc-blue"
                          />
                          <span>{interest}</span>
                        </label>
                      ))}
                    </div>
                    {errors.interests && (
                      <span className="text-xs text-red-600">{errors.interests[0]}</span>
                    )}
                  </div>

                  {/* Section 4: Motivation */}
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="text-sm font-extrabold uppercase tracking-wider text-arc-blue">04</span>
                      <h3 className="text-base font-bold text-arc-navy">
                        Motivation & Goals <span className="text-red-500">*</span>
                      </h3>
                    </div>

                    <label className="grid gap-2 text-sm font-semibold text-arc-slate">
                      <span>What inspires you to join Arc Optical Club?</span>
                      <textarea
                        name="motivation"
                        placeholder="Tell us about your background, relevant skills, or what joining Arc means to you (at least 20 characters)…"
                        required
                        minLength={20}
                        maxLength={2000}
                        rows={4}
                        className={`${inputClass} resize-y`}
                      />
                      {errors.motivation && (
                        <span className="text-xs text-red-600">{errors.motivation[0]}</span>
                      )}
                    </label>
                  </div>

                  {/* Honeypot */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="join-website">Leave empty</label>
                    <input id="join-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                  </div>

                  {/* Consent Checkbox */}
                  <div className="bg-slate-50 p-5">
                    <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-arc-slate">
                      <input
                        type="checkbox"
                        name="consent"
                        required
                        className="mt-1 h-4 w-4 shrink-0 text-arc-blue focus:ring-arc-blue"
                      />
                      <span>
                        I confirm that the information provided is accurate and agree that Arc Optical Club may process
                        my registration to contact me regarding membership, volunteer opportunities, and club activities.
                      </span>
                    </label>
                    {errors.consent && (
                      <span className="mt-2 block text-xs text-red-600">
                        Please agree to the consent declaration before registering.
                      </span>
                    )}
                  </div>

                  {/* Error Alert */}
                  {status === 'error' && (
                    <div className="bg-red-50 p-4 text-sm font-medium text-red-700">
                      {errorMessage}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
                    <p className="text-sm text-arc-slate">
                      Have a question first?{' '}
                      <Link to="/contact" className="font-bold text-arc-blue hover:underline">
                        Contact us here
                      </Link>
                    </p>

                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-arc-blue px-8 py-3.5 text-base font-extrabold text-white transition hover:bg-[#01598f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-arc-blue sm:w-auto disabled:opacity-70"
                    >
                      {status === 'sending' ? (
                        <>
                          <LoaderCircle size={18} className="animate-spin" />
                          Submitting Registration…
                        </>
                      ) : (
                        <>
                          Complete Registration
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </fieldset>
              </form>
            </>
          )}
        </div>
      </Container>
    </main>
  )
}
