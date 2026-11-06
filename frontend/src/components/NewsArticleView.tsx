import SiteImage from './SiteImage'
import { UserRound } from 'lucide-react'
import { articleDate, contentImage } from '../lib/content'
import type { NewsArticle } from '../lib/content'

export default function NewsArticleView({ article }: { article: NewsArticle }) {
  return <article className="news-article"><header><p className="article-category">{article.category}</p><h1>{article.title}</h1><p className="article-meta">{article.author}<span>·</span><time dateTime={article.publishedAt}>{articleDate(article.publishedAt)}</time></p></header><figure className="article-cover"><SiteImage sizes="(max-width: 767px) 100vw, 800px" loading="eager" src={contentImage(article.image)} alt={article.alt}/></figure><div className="article-body">{article.blocks.map((block, index) => block.type === 'image' ? <figure key={index}><SiteImage sizes="(max-width: 767px) 100vw, 800px" src={contentImage(block.src)} alt={block.alt} loading="lazy"/>{block.caption && <figcaption>{block.caption}</figcaption>}</figure> : block.type === 'heading' ? <h2 key={index}>{block.text}</h2> : <p key={index}>{block.text}</p>)}</div><footer className="article-author"><span><UserRound size={25}/></span><div><small>Written by</small><strong>{article.author}</strong></div></footer></article>
}
