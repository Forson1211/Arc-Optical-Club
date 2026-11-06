export type Outreach = {
  id: string; name: string; program: string; location: string; date: string;
  status: 'Planning' | 'Confirmed' | 'Completed'; screened: number; target: number
}
export type Volunteer = { id: string; name: string; email: string; role: string; status: 'Active' | 'Pending' | 'Declined'; phone?: string; location?: string; organization?: string; interests?: string[]; availability?: string; motivation?: string; source?: string; createdAt?: string; consentAt?: string }
export type Donation = { id: string; name: string; amount: number; program: string; date: string; status: 'Received' | 'Pledged' | 'Test'; source?: 'paystack'; paymentReference?: string; paymentMode?: 'test' | 'live' }
export type Message = { id: string; name: string; email?: string; phone?: string; company?: string; subject: string; message: string; date: string; read: boolean; status?: string }
export type Subscriber = { id: string; email: string; status: 'subscribed' | 'unsubscribed'; createdAt: string }
export type Workspace = { outreaches: Outreach[]; volunteers: Volunteer[]; donations: Donation[]; messages: Message[]; subscribers: Subscriber[] }
export const programNames = ['Sight For Kids', 'Operation Sight For All', 'Myopia Rescue']
export const emptyWorkspace = (): Workspace => ({ outreaches: [], volunteers: [], donations: [], messages: [], subscribers: [] })

export const money = (amount: number) => `GH₵ ${amount.toLocaleString('en-GH', { maximumFractionDigits: 2 })}`
export const shortDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Accra' })
export const todayInGhana = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Accra', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (value: string | number) => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`
  const blob = new Blob(['\uFEFF', rows.map(row => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = filename; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
