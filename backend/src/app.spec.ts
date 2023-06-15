import { mock } from 'jest-mock-extended'
import mockConsole from 'jest-mock-console'

import { App, DEFAULT_URL } from './app'
import { UrlLoaderService } from './services/url-loader.service'

process.argv = []

describe('App', () => {
  const urlLoader = mock<UrlLoaderService>()
  const app = new App(urlLoader)

  it('should call url loader and return 0 when word not present', async () => {
    // given
    urlLoader.crawl.mockResolvedValue(['web site text'])
    mockConsole()

    // when
    await app.run()

    // then
    expect(urlLoader.crawl).toHaveBeenCalledTimes(1)
    expect(urlLoader.crawl).toHaveBeenCalledWith(DEFAULT_URL, '2')
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith('Found 0 instances of \'kayako\' in the body of the page')
  })

  it('should call url loader and return count when word present', async () => {
    // given
    urlLoader.crawl.mockResolvedValue(['kayako Kayako text'])

    mockConsole()

    // when
    await app.run()

    // then
    expect(urlLoader.crawl).toHaveBeenCalledTimes(1)
    expect(urlLoader.crawl).toHaveBeenCalledWith('https://www.kayako.com/', '2')
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith('Found 2 instances of \'kayako\' in the body of the page')
  })

  it('should return default URL when no url passed', async () => {
    // when
    const appParameters = app.parseCli(['node', 'main.js'])

    // then
    expect(appParameters.url).toBe('https://www.kayako.com/')
  })

  it('should return specified URL', async () => {
    const url = 'https://www.google.com/'
    expect(app.parseCli(['node', 'main.js', '--url', url]).url).toBe(url)
    expect(app.parseCli(['node', 'main.js', '-u', url]).url).toBe(url)
  })

  it('should return default word when no word passed', async () => {
    // when
    const appParameters = app.parseCli(['node', 'main.js'])

    // then
    expect(appParameters.word).toBe('kayako')
  })

  it('should return specified word', async () => {
    const word = 'banana'
    expect(app.parseCli(['node', 'main.js', '--word', word]).word).toBe(word)
    expect(app.parseCli(['node', 'main.js', '-w', word]).word).toBe(word)
  })

  it('should return default depth when no depth passed', async () => {
    // when
    const appParameters = app.parseCli(['node', 'main.js'])

    // then
    expect(appParameters.depth).toBe('2')
  })

  it('should return specified depth', async () => {
    const depth = '4'
    expect(app.parseCli(['node', 'main.js', '--depth', depth]).depth).toBe(depth)
    expect(app.parseCli(['node', 'main.js', '-d', depth]).depth).toBe(depth)
  })

  describe('CLI errors', () => {
    let processExitMock: jest.SpyInstance
    const exitError = 'Process exited'

    beforeEach(() => {
      processExitMock = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error(exitError)
      })
    })

    afterEach(() => {
      processExitMock.mockRestore()
    })

    test('should call process.exit when depth is not a positive integer', () => {
      const depth = 'a'

      expect(() => app.parseCli(['node', 'main.js', '--depth', depth])).toThrow(exitError)
      expect(processExitMock).toHaveBeenCalledWith(1)
    })

    test('should call process.exit when URL is invalid', () => {
      const url = 'invalid url'

      expect(() => app.parseCli(['node', 'main.js', '-u', url])).toThrow(exitError)
      expect(processExitMock).toHaveBeenCalledWith(1)
    })
  })
})
