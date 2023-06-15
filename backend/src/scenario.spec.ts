import { UrlLoaderService } from './services/url-loader.service'
import { App } from './app'
import mockConsole from 'jest-mock-console'
import { exec } from 'child_process'

let urlLoader: UrlLoaderService
let app: App
jest.setTimeout(120000)

describe('Full testing of application with locally served site', () => {
  it('Runs app on port 8080', async () => {
    urlLoader = await UrlLoaderService.getInstance()
    app = await new App(urlLoader)
    const page = await urlLoader.getBrowser().newPage()
    const url = 'http://localhost:8080/kayako.com'
    const word = 'kayako'
    const depth = 1
    mockConsole()

    const texts = await urlLoader._bfsCrawling(page, url, depth)
    let wordInstances = 0

    for (const text of texts) {
      const count = (text.toLocaleLowerCase().match(new RegExp(word, 'ig')) ?? []).length
      wordInstances += count
    }

    await app.process({
      url: url,
      word: word,
      depth: depth
    })
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith(`Found ${wordInstances} instances of '${word}' in the body of the page`)
    exec('kill $(lsof -t -i:8080)')
  })
})
