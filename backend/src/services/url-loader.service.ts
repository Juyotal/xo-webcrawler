import puppeteer, { Browser } from 'puppeteer'

import { domExtractHyperlinks, domExtractText, pageEval } from './page-eval.service.js'

export interface TextAndLinks{
  text: string
  links: string[]
}

export interface urlDict{
  [key: string]: boolean
}

export interface levelDict{
  [key: string]: number
}

function resolveLinks (links: string[], host: string): string[] {
  const ignore = ['#', 'mailto', 'malito']

  return links.filter(link =>
    link.includes(host) &&
    !link.endsWith('.pdf') &&
    ignore.every(keyword => !link.includes(keyword))
  ).map(link =>
    link.endsWith('/') ? link.slice(0, -1) : link // remove trailing slashes.
  )
}

export class UrlLoaderService {
  private static instance: UrlLoaderService

  static async getInstance (): Promise<UrlLoaderService> {
    if (UrlLoaderService.instance === undefined) {
      const browser = await puppeteer.launch()
      UrlLoaderService.instance = new UrlLoaderService(browser)
    }
    return UrlLoaderService.instance
  }

  private constructor (private readonly browser: Browser) {
  }

  async loadUrlTextAndLinks (page: puppeteer.Page, url: string): Promise<TextAndLinks> {
    await page.goto(url)
    await page.waitForSelector('body')
    const [text, links] = await Promise.all([await pageEval(page, domExtractText), await pageEval(page, domExtractHyperlinks)])

    return { text, links }
  }

  async crawl (url: string, maxLevel: number): Promise<string[]> {
    const page = await this.browser.newPage()
    const extractedTexts = await this._bfsCrawling(page, url, maxLevel)
    await this.browser.close()

    return extractedTexts
  }

  async _bfsCrawling (page: puppeteer.Page, url: string, maxLevel: number): Promise<string[]> {
    const seen = new Set<string>()
    const texts = new Set<string>()

    const linkLevel: levelDict = {}

    linkLevel[url] = 0
    seen.add(url)

    const host = new URL(url).hostname
    const q: string[] = [url]

    while (q.length > 0) {
      const currUrl = q.shift() as string
      // console.log(currUrl, linkLevel[currUrl])
      const extract = await this.loadUrlTextAndLinks(page, currUrl)

      texts.add(extract.text)
      if (linkLevel[currUrl] === maxLevel) {
        continue
      }

      const links = resolveLinks(extract.links, host)

      for (const link of links) {
        if (seen.has(link)) {
          continue
        }
        seen.add(link)
        linkLevel[link] = linkLevel[currUrl] + 1
        q.push(link)
      }
    }
    return Array.from(texts)
  }

  getBrowser (): Browser {
    return this.browser
  }
}
