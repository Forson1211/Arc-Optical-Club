import mongoose from 'mongoose'
import { listRecords, storageMode } from './store.js'

export async function getAnalytics(days: number) {
  const now = new Date()
  const start = new Date(now); start.setUTCHours(0, 0, 0, 0); start.setUTCDate(start.getUTCDate() - days + 1)
  const weekStart = new Date(now); weekStart.setUTCHours(0, 0, 0, 0); weekStart.setUTCDate(weekStart.getUTCDate() - 6)
  const from = start.toISOString(), until = now.toISOString()
  type Daily = { date: string; views: number; visits: number }
  let traffic: { views: number; visits: number; browsers: number; interactions: number; daily: Daily[]; topPages: { path: string; views: number }[] }
  if (storageMode() === 'mongodb') {
    const [result] = await mongoose.connection.collection('siteevents').aggregate([
      { $match: { createdAt: { $gte: from, $lte: until } } },
      { $facet: {
        views: [{ $match: { type: 'page_view' } }, { $count: 'count' }],
        visits: [{ $match: { type: 'page_view' } }, { $group: { _id: '$sessionId' } }, { $count: 'count' }],
        browsers: [{ $match: { type: 'page_view' } }, { $group: { _id: '$visitorId' } }, { $count: 'count' }],
        interactions: [{ $match: { type: 'click' } }, { $count: 'count' }],
        daily: [{ $match: { type: 'page_view', createdAt: { $gte: weekStart.toISOString() } } },
          { $group: { _id: { date: { $substrBytes: ['$createdAt', 0, 10] }, session: '$sessionId' }, views: { $sum: 1 } } },
          { $group: { _id: '$_id.date', views: { $sum: '$views' }, visits: { $sum: 1 } } },
          { $project: { _id: 0, date: '$_id', views: 1, visits: 1 } }],
        topPages: [{ $match: { type: 'page_view' } }, { $group: { _id: '$path', views: { $sum: 1 } } }, { $sort: { views: -1, _id: 1 } }, { $limit: 10 }, { $project: { _id: 0, path: '$_id', views: 1 } }],
      } },
    ]).toArray()
    traffic = { views: result.views[0]?.count || 0, visits: result.visits[0]?.count || 0, browsers: result.browsers[0]?.count || 0, interactions: result.interactions[0]?.count || 0, daily: result.daily, topPages: result.topPages }
  } else {
    const events = (await listRecords('siteevents')).filter(e => e.createdAt >= from && e.createdAt <= until)
    const views = events.filter(e => e.type === 'page_view')
    const dates = [...new Set(views.filter(e => e.createdAt >= weekStart.toISOString()).map(e => e.createdAt.slice(0, 10)))]
    traffic = { views: views.length, visits: new Set(views.map(e => e.sessionId)).size, browsers: new Set(views.map(e => e.visitorId)).size,
      interactions: events.filter(e => e.type === 'click').length,
      daily: dates.map(date => ({ date, views: views.filter(e => e.createdAt.startsWith(date)).length, visits: new Set(views.filter(e => e.createdAt.startsWith(date)).map(e => e.sessionId)).size })),
      topPages: [...new Set(views.map(e => String(e.path)))].map(path => ({ path, views: views.filter(e => e.path === path).length })).sort((a, b) => b.views - a.views || a.path.localeCompare(b.path)).slice(0, 10) }
  }
  traffic.daily = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart); date.setUTCDate(date.getUTCDate() + i)
    const key = date.toISOString().slice(0, 10)
    return traffic.daily.find(d => d.date === key) || { date: key, views: 0, visits: 0 }
  })
  const [outreaches, volunteers, donations] = await Promise.all([listRecords('outreaches'), listRecords('volunteers'), listRecords('donations')])
  const received = donations.filter(d => d.status === 'Received')
  const byProgram = [...new Set(received.map(d => String(d.program)))].map(program => ({ program, amount: Math.round(received.filter(d => d.program === program).reduce((sum, d) => sum + Number(d.amount), 0) * 100) / 100 }))
  return { days, from, generatedAt: until, traffic,
    mission: { completed: outreaches.filter(o => o.status === 'Completed').length, outreaches: outreaches.length, active: volunteers.filter(v => v.status === 'Active').length, volunteers: volunteers.length },
    giving: { received: Math.round(received.reduce((sum, d) => sum + Number(d.amount), 0) * 100) / 100, pledged: Math.round(donations.filter(d => d.status === 'Pledged').reduce((sum, d) => sum + Number(d.amount), 0) * 100) / 100, byProgram },
  }
}
