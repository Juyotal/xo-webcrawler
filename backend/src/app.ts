
import { UrlLoaderService } from './services/url-loader.service.js'
import { Command } from 'commander'

interface AppParameters {
  url: string
  word: string
  depth: number
}

export const DEFAULT_URL = 'https://www.kayako.com/'
export const DEFAULT_WORD = 'kayako'

const commandOptions = [
  {
    flags: '-u, --url <url>',
    description: 'URL to load',
    defaultValue: DEFAULT_URL
  },
  {
    flags: '-w, --word <word>',
    description: 'Word to search',
    defaultValue: DEFAULT_WORD
  },
  {
    flags: '-d, --depth <depth>',
    description: 'Depth of the search',
    defaultValue: '2'
  }
]

export function isValidUrl (url: string): boolean {
  const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
  return urlPattern.test(url)
}

export function isPositiveInteger (input: string): boolean {
  const integerValue = parseInt(input, 10)

  return (Number.isInteger(integerValue) && integerValue > 0)
}

export class App {
  /* istanbul ignore next */
  constructor (private readonly urlLoader: UrlLoaderService, private readonly command = new Command()) {
  }

  async run (): Promise<void> {
    const appParameters = this.parseCli()

    await this.process(appParameters)
  }

  async process (appParameters: AppParameters): Promise<void> {
    let totalMatch: number = 0
    const extractedTexts = await this.urlLoader.crawl(appParameters.url, appParameters.depth)
    const word = appParameters.word.toLocaleLowerCase()
    for (const text of extractedTexts) {
      const count = (text.toLocaleLowerCase().match(new RegExp(word, 'ig')) ?? []).length
      totalMatch += count
    }
    console.log(`Found ${totalMatch} instances of '${word}' in the body of the page`)
  }

  parseCli (argv: readonly string[] = process.argv): AppParameters {
    for (const option of commandOptions) {
      this.command.option(option.flags, option.description, option.defaultValue)
    }

    this.command.parse(argv)
    const options = this.command.opts()

    if (!isPositiveInteger(options.depth)) {
      console.log('error: depth must be a positive integer')
      process.exit(1)
    }

    if (!isValidUrl(options.url)) {
      console.log('error: link must be a valid URL')
      process.exit(1)
    }

    return { url: options.url, word: options.word, depth: options.depth }
  }
}
