import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/admin/','/profile/','/watchlist','/api/','/download/','/search?','/discover?*q=']},sitemap:`${siteUrl}/sitemap.xml`,host:siteUrl}}
