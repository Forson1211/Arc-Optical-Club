import SiteImage from '../components/SiteImage'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Search } from 'lucide-react'
import Container from '../components/Container'
import PageIntro, { ContentState } from '../components/PageIntro'
import { articleDate, contentImage, useContent } from '../lib/content'
import type { NewsArticle } from '../lib/content'

export default function News() {
  const { data, error, retry } = useContent<NewsArticle[]>('/content/news')
  const [query, setQuery] = useState(''), [category, setCategory] = useState('All')
  const categories = ['All', ...new Set(data?.map(article => article.category) || [])]
  const articles = data?.filter(article => (category === 'All' || article.category === category) && `${article.title} ${article.excerpt}`.toLowerCase().includes(query.toLowerCase()))
  return <main className="inner-page"><PageIntro label="The Arc journal" title="News & stories.">From our community, for our community.</PageIntro><Container>{!data ? <ContentState error={error} retry={retry}/> : <><div className="news-tools"><div className="page-filters" aria-label="Filter stories">{categories.map(value => <button key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div><label className="news-search"><Search size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search stories" aria-label="Search stories"/></label></div>{articles?.length ? <div className="news-grid">{articles.map(article => <article key={article.id} className="news-card"><Link to={`/news/${article.id}`} aria-label={`Read ${article.title}`}><SiteImage src={contentImage(article.image)} alt={article.alt} loading="lazy"/></Link><div><p className="article-category">{article.category}<span> / </span><time dateTime={article.publishedAt}>{articleDate(article.publishedAt)}</time></p><h2><Link to={`/news/${article.id}`}>{article.title}</Link></h2><p>{article.excerpt}</p><Link className="text-link" to={`/news/${article.id}`}>Read story <ArrowUpRight size={17}/></Link></div></article>)}</div> : <ContentState empty={data.length ? 'No stories match your search.' : 'Our next chapter is on its way. Check back for stories from Arc.'}/>}</>}</Container></main>
}
