import SiteImage from '../components/SiteImage'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Facebook, Linkedin } from 'lucide-react'
import { useEffect, useState } from 'react'
import Container from '../components/Container'
import { ContentState } from '../components/PageIntro'
import NewsArticleView from '../components/NewsArticleView'
import NewsletterSignup from '../components/NewsletterSignup'
import { articleDate, contentImage, useContent } from '../lib/content'
import type { NewsArticle } from '../lib/content'

export default function NewsDetail() {
  const { id } = useParams(), { data: article, error, retry } = useContent<NewsArticle>(`/content/news/${id}`)
  const { data: news } = useContent<NewsArticle[]>('/content/news'), [copied, setCopied] = useState('')
  const url = encodeURIComponent(window.location.href)
  useEffect(() => { if (article) document.title = `${article.title} | Arc Optical Club`; return () => { document.title = 'Arc Optical Club' } }, [article])
  async function copy() { try { await navigator.clipboard.writeText(window.location.href); setCopied('Link copied.') } catch { setCopied('Copy the link from your browser’s address bar.') } }
  return <main className="inner-page article-page"><Container><Link className="text-link" to="/news"><ArrowLeft size={16}/>All stories</Link>{!article ? <ContentState error={error} retry={retry}/> : <div className="article-layout"><div><NewsArticleView article={article}/><div className="article-share"><span>Share this story</span><a href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noreferrer" aria-label="Share on Facebook"><Facebook size={18}/></a><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`} target="_blank" rel="noreferrer" aria-label="Share on LinkedIn"><Linkedin size={18}/></a><a href={`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + window.location.href)}`} target="_blank" rel="noreferrer">WhatsApp</a><button onClick={() => { void copy() }} aria-label="Copy article link"><Copy size={17}/></button><small role="status">{copied}</small></div></div><aside className="article-sidebar"><NewsletterSignup/><section className="recent-stories"><h2>Recent stories</h2>{news?.filter(item => item.id !== id).slice(0, 5).map(item => <Link key={item.id} to={`/news/${item.id}`}><SiteImage sizes="75px" src={contentImage(item.image)} alt="" loading="lazy"/><span><strong>{item.title}</strong><time dateTime={item.publishedAt}>{articleDate(item.publishedAt)}</time></span></Link>)}{news && news.filter(item => item.id !== id).length === 0 && <p>More stories are on the way.</p>}</section></aside></div>}</Container></main>
}
