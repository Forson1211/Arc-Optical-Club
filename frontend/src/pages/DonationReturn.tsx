import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, LoaderCircle } from 'lucide-react'
import Container from '../components/Container'
import { api, apiErrorMessage } from '../lib/api'

type Receipt = { status: 'received' | 'pending'; reference: string; amount?: number; mode?: 'test' | 'live' }
export default function DonationReturn() {
  const [search] = useSearchParams(), reference = search.get('reference') || search.get('trxref') || ''
  const [receipt, setReceipt] = useState<Receipt | null>(null), [error, setError] = useState(''), [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError(''); setReceipt(null)
    if (!/^arc-[a-f0-9]{48}$/.test(reference)) { setError('We could not find a valid donation reference in this link.'); return }
    void api.get(`/donations/verify/${reference}`, { signal: controller.signal, timeout: 25000 }).then(response => setReceipt(response.data.data)).catch(failure => { if (!controller.signal.aborted) setError(apiErrorMessage(failure, 'Your payment could not be verified. Please check again.')) })
    return () => controller.abort()
  }, [reference, version])
  return <main className="inner-page donation-return"><Container><section>{!error && !receipt ? <LoaderCircle className="animate-spin" size={35}/> : receipt?.status === 'received' ? <Check size={40}/> : null}<h1>{error ? 'Let’s check your donation.' : !receipt ? 'Confirming your donation…' : receipt.status === 'pending' ? 'Your payment is not confirmed yet.' : receipt.mode === 'test' ? 'Test payment verified.' : 'Thank you for giving.'}</h1><p role="status">{error || (!receipt ? 'We’re checking your payment securely with Paystack.' : receipt.status === 'pending' ? 'If you completed checkout, wait a moment and check again. Please verify before starting another payment.' : receipt.mode === 'test' ? 'This was a test transaction. No live donation has been recorded.' : `Your donation of GHS ${receipt.amount?.toLocaleString('en-GH')} has been received. Thank you for supporting clearer vision.`)}</p>{reference && <p className="donation-reference">Reference: {reference}</p>}{(error || receipt?.status === 'pending') && <button className="page-button" onClick={() => setVersion(value => value + 1)}>Check payment status</button>}<div><Link className="text-link" to="/">Back to Arc</Link><Link className="text-link" to="/contact?subject=Donation%20payment%20enquiry">Contact our team</Link></div></section></Container></main>
}
